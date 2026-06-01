import { NextResponse } from "next/server"
import { getServerSession, getSheets, sessionToScope } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const sheets = await getSheets(sessionToScope(session))
    return NextResponse.json({ sheets })
  } catch (error) {
    console.error("dashboard/sheets failed:", error)
    return NextResponse.json({ error: "Failed to load sheets" }, { status: 500 })
  }
}
