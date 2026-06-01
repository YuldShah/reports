import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as XLSX from "xlsx"
import {
  getReportsForExport,
  getServerSession,
  sessionToScope,
  type EnrichedReportRow,
  type ReportFilters,
} from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseFilters(req: NextRequest): ReportFilters {
  const q = req.nextUrl.searchParams
  const userIdRaw = q.get("userId")
  const userId = userIdRaw ? Number(userIdRaw) : undefined
  return {
    teamId: q.get("teamId") ?? undefined,
    userId: userId != null && Number.isFinite(userId) ? userId : undefined,
    templateId: q.get("templateId") ?? undefined,
    from: q.get("from") ?? undefined,
    to: q.get("to") ?? undefined,
    search: q.get("search") ?? undefined,
  }
}

function toNumeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, "").replace(",", ".")
    if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function fmtDate(iso: string): string {
  return iso.replace("T", " ").slice(0, 16)
}

function cellText(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  let base = (name || "Sheet").replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 28) || "Sheet"
  let candidate = base
  let i = 2
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 25)} ${i++}`
  }
  used.add(candidate.toLowerCase())
  return candidate
}

/** Build an array-of-arrays sheet for one template's reports, with a numeric totals row. */
function buildAoa(rows: EnrichedReportRow[]): (string | number)[][] {
  const sample = rows[0]
  const cellDefs = sample.cells // same template => same field set
  const header = ["Submitted At", "Team", "Submitted By", ...cellDefs.map((c) => c.label)]

  const totals: Record<number, number> = {}
  const dataRows = rows.map((r) => {
    const line: (string | number)[] = [fmtDate(r.createdAt), r.team.name, r.user.name]
    cellDefs.forEach((def, idx) => {
      const cell = r.cells.find((c) => c.fieldId === def.fieldId)
      if (cell?.photoUrls && cell.photoUrls.length) {
        line.push(cell.photoUrls.join(", "))
      } else {
        const value = cell?.value
        line.push(cellText(value))
        if (def.type === "number") {
          const n = toNumeric(value)
          if (n != null) totals[idx] = (totals[idx] ?? 0) + n
        }
      }
    })
    return line
  })

  const aoa: (string | number)[][] = [header, ...dataRows]
  if (Object.keys(totals).length > 0) {
    const totalsRow: (string | number)[] = ["TOTAL", "", ""]
    cellDefs.forEach((_, idx) => totalsRow.push(totals[idx] ?? ""))
    aoa.push(totalsRow)
  }
  return aoa
}

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const format = (req.nextUrl.searchParams.get("format") ?? "xlsx").toLowerCase()
  const filters = parseFilters(req)

  let reports: EnrichedReportRow[]
  try {
    reports = await getReportsForExport(sessionToScope(session), filters)
  } catch (error) {
    console.error("dashboard/export failed:", error)
    return NextResponse.json({ error: "Failed to build export" }, { status: 500 })
  }

  // group by template
  const groups = new Map<string, { name: string; rows: EnrichedReportRow[] }>()
  for (const r of reports) {
    const g = groups.get(r.template.id) ?? { name: r.template.name || "Untitled", rows: [] }
    g.rows.push(r)
    groups.set(r.template.id, g)
  }

  const stamp = new Date().toISOString().slice(0, 10)

  if (format === "csv") {
    // CSV is single-sheet. One template => that sheet; otherwise a flat summary.
    let ws: XLSX.WorkSheet
    if (groups.size === 1) {
      ws = XLSX.utils.aoa_to_sheet(buildAoa([...groups.values()][0].rows))
    } else {
      const header = ["Submitted At", "Team", "Submitted By", "Template", "Title"]
      const data = reports.map((r) => [fmtDate(r.createdAt), r.team.name, r.user.name, r.template.name, r.title])
      ws = XLSX.utils.aoa_to_sheet([header, ...data])
    }
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reports-${stamp}.csv"`,
      },
    })
  }

  // xlsx: one tab per template
  const wb = XLSX.utils.book_new()
  const used = new Set<string>()
  if (groups.size === 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No reports"]]), "Reports")
  } else {
    for (const group of groups.values()) {
      const ws = XLSX.utils.aoa_to_sheet(buildAoa(group.rows))
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(group.name, used))
    }
  }
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reports-${stamp}.xlsx"`,
    },
  })
}
