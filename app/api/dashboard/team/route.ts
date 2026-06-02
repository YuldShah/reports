import { NextResponse } from "next/server"
import { getScope, getTeams } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const scope = await getScope()
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const teams = await getTeams(scope)
    return NextResponse.json({ teams })
  } catch (error) {
    console.error("dashboard/team failed:", error)
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 })
  }
}
