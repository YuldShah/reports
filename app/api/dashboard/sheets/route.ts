import { NextResponse } from "next/server"
import { getScope, getSheets } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const scope = await getScope()
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const sheets = await getSheets(scope)
    return NextResponse.json({ sheets })
  } catch (error) {
    console.error("dashboard/sheets failed:", error)
    return NextResponse.json({ error: "Failed to load sheets" }, { status: 500 })
  }
}
