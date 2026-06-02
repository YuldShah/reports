import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getReportsFiltered, getScope, type ReportFilters } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseFilters(req: NextRequest): ReportFilters {
  const q = req.nextUrl.searchParams
  const userIdRaw = q.get("userId")
  const userId = userIdRaw ? Number(userIdRaw) : undefined
  const submitter = q.get("submitter")
  return {
    teamId: q.get("teamId") ?? undefined,
    userId: userId != null && Number.isFinite(userId) ? userId : undefined,
    templateId: q.get("templateId") ?? undefined,
    from: q.get("from") ?? undefined,
    to: q.get("to") ?? undefined,
    search: q.get("search") ?? undefined,
    submitter: submitter === "self" || submitter === "others" ? submitter : undefined,
    page: q.get("page") ? Number(q.get("page")) : undefined,
    pageSize: q.get("pageSize") ? Number(q.get("pageSize")) : undefined,
  }
}

export async function GET(req: NextRequest) {
  const scope = await getScope()
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const result = await getReportsFiltered(scope, parseFilters(req))
    return NextResponse.json(result)
  } catch (error) {
    console.error("dashboard/reports failed:", error)
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 })
  }
}
