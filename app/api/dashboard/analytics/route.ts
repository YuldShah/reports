import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAnalytics, getServerSession, sessionToScope } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const q = req.nextUrl.searchParams
  try {
    const analytics = await getAnalytics(sessionToScope(session), {
      from: q.get("from") ?? undefined,
      to: q.get("to") ?? undefined,
    })
    return NextResponse.json(analytics)
  } catch (error) {
    console.error("dashboard/analytics failed:", error)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
