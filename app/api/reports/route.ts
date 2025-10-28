import { type NextRequest, NextResponse } from "next/server"
import { getAllReports, createReport, updateReport, getReportsByUser, getReportsByTeam, getTeamById, getTemplateById as getDbTemplateById, getUserByTelegramId } from "@/lib/database"
import { getTemplateById as getStaticTemplateById } from "@/lib/report-templates"
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
    const { userId, teamId, templateId, title, answers, templateData } = body

    if (!userId || !teamId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const team = await getTeamById(teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    const resolvedTemplateId = templateId || team?.templateId
    const normalizedAnswers = answers || templateData

    if (!resolvedTemplateId) {
      return NextResponse.json({ error: "Template not specified for this report" }, { status: 400 })
    }

    if (!normalizedAnswers || Object.keys(normalizedAnswers).length === 0) {
      return NextResponse.json({ error: "No answers provided for the report" }, { status: 400 })
    }

    // Create report in database
    const report = await createReport({
      userId,
      teamId,
      templateId: resolvedTemplateId,
      title,
      answers: normalizedAnswers,
      templateData: templateData ?? normalizedAnswers,
    })

    // Sync to Google Sheets if enabled
    if (body.syncToSheets !== false) {
      try {
        // Get related data for Google Sheets
        const user = await getUserByTelegramId(userId)
        const template = await getDbTemplateById(resolvedTemplateId) || getStaticTemplateById(resolvedTemplateId)

        if (user && team && template) {
          // Format questions and answers for Google Sheets
          const templateFields = Array.isArray((template as any).questions)
            ? (template as any).questions.map((q: any, index: number) => ({
                id: q.id || `question_${index}`,
                label: q.question || q.label || `Question ${index + 1}`,
              }))
            : Array.isArray((template as any).fields)
              ? (template as any).fields.map((field: any, index: number) => ({
                  id: field.id || `field_${index}`,
                  label: field.label || field.question || `Field ${index + 1}`,
                }))
              : []

          const answerEntries = templateFields.map((field: { id: string; label: string }, index: number) => {
            const rawAnswer = normalizedAnswers[field.id] ?? normalizedAnswers[`question_${index}`]
            const answerValue =
              rawAnswer === undefined || rawAnswer === null || (typeof rawAnswer === 'string' && rawAnswer.trim() === '')
                ? 'No answer'
                : String(rawAnswer)

            return {
              label: field.label,
              value: answerValue,
            }
          })

          const knownAnswerKeys = new Set(templateFields.map((field: { id: string }) => field.id))
          for (const [key, rawAnswer] of Object.entries(normalizedAnswers)) {
            if (knownAnswerKeys.has(key) || key.startsWith('question_')) {
              continue
            }

            const additionalValue =
              rawAnswer === undefined || rawAnswer === null || (typeof rawAnswer === 'string' && rawAnswer.trim() === '')
                ? 'No answer'
                : String(rawAnswer)

            answerEntries.push({
              label: key,
              value: additionalValue,
            })
          }

          const createdAt = report.createdAt ? new Date(report.createdAt).toISOString() : new Date().toISOString()

          const sheetData = {
            reportId: report.id,
            timestamp: createdAt,
            teamName: team.name,
            userName: `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`,
            answers: answerEntries,
          }

          await appendToGoogleSheet({
            templateKey: resolvedTemplateId,
            templateName: template.name,
          }, sheetData)
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
