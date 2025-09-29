import { type NextRequest, NextResponse } from "next/server"
import { getAllReports, createReport, updateReport, getReportsByUser, getReportsByTeam, getTeamById, getTemplateById, getUserByTelegramId } from "@/lib/database"
import { appendToGoogleSheet } from "@/lib/google-sheets"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const teamId = searchParams.get("teamId")

    let reports
    if (userId) {
      reports = await getReportsByUser(Number(userId))
    } else if (teamId) {
      reports = await getReportsByTeam(teamId)
    } else {
      reports = await getAllReports()
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, teamId, templateId, title, answers } = body

    if (!userId || !teamId || !templateId || !title || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create report in database
    const report = await createReport({
      userId,
      teamId,
      templateId,
      title,
      answers,
    })

    // Sync to Google Sheets if enabled
    if (body.syncToSheets !== false) {
      try {
        // Get related data for Google Sheets
        const user = await getUserByTelegramId(userId)
        const team = await getTeamById(teamId)
        const template = await getTemplateById(templateId)

        if (user && team && template) {
          // Format questions and answers for Google Sheets
          const questionsAnswers = template.questions.map((q: any, index: number) => {
            const answer = answers[`question_${index}`] || answers[q.id] || 'No answer'
            return `${q.question}: ${answer}`
          }).join(' | ')

          const sheetData = {
            timestamp: new Date().toISOString(),
            teamName: team.name,
            userName: `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`,
            questionsAnswers,
          }

          await appendToGoogleSheet(template.name, sheetData)
        }
      } catch (sheetError) {
        console.error("Failed to sync to Google Sheets:", sheetError)
        // Continue anyway - report was created successfully
      }
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const updatedReport = updateReport(id, updates)

    if (!updatedReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ report: updatedReport })
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}
