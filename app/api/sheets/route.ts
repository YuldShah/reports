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
      return NextResponse.json({ 
        error: "Google Sheets not configured", 
        url: "#",
        configured: false
      }, { status: 200 })
    }

    // Return the Google Sheets URL
    const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    let url = `${baseUrl}/edit`
    
    if (teamName) {
      const sheetName = `Team_${teamName.replace(/[^a-zA-Z0-9]/g, "_")}`
      url = `${baseUrl}/edit#gid=0&range=${sheetName}`
    }

    // If client wants to redirect directly
    if (searchParams.get("redirect") === "true") {
      return NextResponse.redirect(url)
    }

    return NextResponse.json({ 
      url, 
      configured: true,
      spreadsheetId 
    })
  } catch (error) {
    console.error("Google Sheets URL error:", error)
    return NextResponse.json({ error: "Failed to get Google Sheets URL", url: "#", configured: false }, { status: 500 })
  }
}
