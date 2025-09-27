import { type NextRequest, NextResponse } from "next/server"
import { getAllReports, createReport, updateReport, getReportsByUser, getReportsByTeam } from "@/lib/database"
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
    const { userId, teamId, title, description, priority, category, status = "pending" } = body

    if (!userId || !teamId || !title || !description || !priority || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create report in database
    const report = await createReport({
      userId,
      teamId,
      title,
      description,
      priority,
      status,
      category,
    })

    // Optionally sync to Google Sheets
    if (body.syncToSheets !== false) {
      try {
        const sheetData = {
          timestamp: new Date().toISOString(),
          userName: body.userName || "Unknown User",
          title,
          description,
          priority,
          category,
          status,
          type: body.type || "",
          location: body.location || "",
          urgency: body.urgency || "",
          affectedSystems: body.affectedSystems || "",
          reproductionSteps: body.reproductionSteps || "",
          expectedOutcome: body.expectedOutcome || "",
          actualOutcome: body.actualOutcome || "",
          additionalInfo: body.additionalInfo || "",
        }

        await appendToGoogleSheet(`Team_${teamId}`, sheetData)
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
