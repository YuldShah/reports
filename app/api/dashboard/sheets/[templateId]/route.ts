import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getServerSession, getSheetRows, sessionToScope } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { templateId } = await params
  const q = req.nextUrl.searchParams
  try {
    const sheet = await getSheetRows(sessionToScope(session), templateId, {
      from: q.get("from") ?? undefined,
      to: q.get("to") ?? undefined,
    })
    if (!sheet) return NextResponse.json({ error: "Sheet not found" }, { status: 404 })
    return NextResponse.json(sheet)
  } catch (error) {
    console.error("dashboard/sheets/[templateId] failed:", error)
    return NextResponse.json({ error: "Failed to load sheet" }, { status: 500 })
  }
}
