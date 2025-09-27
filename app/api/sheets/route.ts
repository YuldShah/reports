import { type NextRequest, NextResponse } from "next/server"
import { appendToGoogleSheet } from "@/lib/google-sheets"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamName, reportData } = body

    if (!teamName || !reportData) {
      return NextResponse.json({ error: "Team name and report data are required" }, { status: 400 })
    }

    const result = await appendToGoogleSheet(teamName, reportData)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Google Sheets API error:", error)
    return NextResponse.json({ error: "Failed to save to Google Sheets" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamName = searchParams.get("team")

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY

    if (!spreadsheetId || !apiKey) {
      return NextResponse.json({ error: "Google Sheets not configured" }, { status: 500 })
    }

    // Return sheet URL and configuration info
    const sheetUrl = teamName
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0&range=Team_${teamName.replace(/[^a-zA-Z0-9]/g, "_")}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    return NextResponse.json({
      spreadsheetId,
      sheetUrl,
      configured: true,
    })
  } catch (error) {
    console.error("Google Sheets config error:", error)
    return NextResponse.json({ error: "Failed to get Google Sheets configuration" }, { status: 500 })
  }
}
