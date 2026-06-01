import { NextResponse } from "next/server"
import { getServerSession, getSummary, sessionToScope } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const summary = await getSummary(sessionToScope(session))
    return NextResponse.json(summary)
  } catch (error) {
    console.error("dashboard/summary failed:", error)
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 })
  }
}
