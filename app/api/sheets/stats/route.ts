import { NextResponse } from "next/server"
import { getSheetStatsData } from "@/lib/google-sheets"

export async function GET() {
  try {
    const stats = await getSheetStatsData()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Sheets stats error:", error)
    return NextResponse.json({ error: "Failed to get sheet stats", stats: [] }, { status: 500 })
  }
}
