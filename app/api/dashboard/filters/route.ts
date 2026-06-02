import { NextResponse } from "next/server"
import { getFilterOptions, getScope } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const scope = await getScope()
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const options = await getFilterOptions(scope)
    return NextResponse.json(options)
  } catch (error) {
    console.error("dashboard/filters failed:", error)
    return NextResponse.json({ error: "Failed to load filter options" }, { status: 500 })
  }
}
