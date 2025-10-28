import { type NextRequest, NextResponse } from "next/server"
import { appendToGoogleSheet, getAllSheetsData } from "@/lib/google-sheets"

const getEnvVar = (key: string): string | undefined => (globalThis as any)?.process?.env?.[key]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamName, templateName, reportData } = body
    const resolvedTemplateName = templateName || teamName

    if (!resolvedTemplateName || !reportData) {
      return NextResponse.json({ error: "Template name and report data are required" }, { status: 400 })
    }

    const normalizedReportData = "answers" in reportData
      ? reportData
      : {
          reportId: reportData.reportId || `manual_${Date.now()}`,
          timestamp: reportData.timestamp || new Date().toISOString(),
          teamName: reportData.teamName || "",
          userName: reportData.userName || "",
          answers: Array.isArray(reportData.questionsAnswers)
            ? reportData.questionsAnswers
            : [
                {
                  label: "Questions & Answers",
                  value: reportData.questionsAnswers || "",
                },
              ],
        }

    const result = await appendToGoogleSheet(resolvedTemplateName, normalizedReportData)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Google Sheets API error:", error)
    return NextResponse.json({ error: "Failed to save to Google Sheets" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateName = searchParams.get("template") ?? searchParams.get("team")

    const spreadsheetId = getEnvVar("GOOGLE_SHEETS_ID")

    if (!spreadsheetId) {
      return NextResponse.json({
        error: "Google Sheets not configured",
        sheetUrl: "#",
        configured: false,
      }, { status: 200 })
    }

    try {
      await getAllSheetsData()
    } catch (error) {
      console.error("Google Sheets status check failed:", error)
      return NextResponse.json({
        error: "Unable to access spreadsheet with current service account",
        sheetUrl: "#",
        configured: false,
      }, { status: 200 })
    }

    const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    let sheetUrl = `${baseUrl}/edit`

    if (templateName) {
      const sheetName = `Template_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}`
      sheetUrl = `${baseUrl}/edit#gid=0&range=${sheetName}`
    }

    if (searchParams.get("redirect") === "true") {
      return NextResponse.redirect(sheetUrl)
    }

    return NextResponse.json({
      sheetUrl,
      url: sheetUrl,
      configured: true,
      spreadsheetId,
    })
  } catch (error) {
    console.error("Google Sheets URL error:", error)
    return NextResponse.json({ error: "Failed to get Google Sheets URL", sheetUrl: "#", configured: false }, { status: 500 })
  }
}
