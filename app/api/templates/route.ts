import { NextRequest, NextResponse } from "next/server"
import { ensureStaticTemplatesSynced, getAllTemplates, getTemplateById } from "@/lib/report-templates"
import { updateTeamTemplate } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    await ensureStaticTemplatesSynced()

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")

    if (templateId) {
      const template = getTemplateById(templateId)
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      return NextResponse.json({ template })
    }

    const templates = getAllTemplates()
    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureStaticTemplatesSynced()

    const body = await request.json()
    const { teamId, templateId } = body

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Validate template exists if templateId is provided
    let resolvedTemplateId: string | null = null

    if (templateId) {
      const template = getTemplateById(templateId)
      if (!template) {
        return NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
      }
      resolvedTemplateId = template.id
    }

    const updatedTeam = await updateTeamTemplate(teamId, resolvedTemplateId)

    if (!updatedTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("Error updating team template:", error)
    return NextResponse.json({ error: "Failed to update team template" }, { status: 500 })
  }
}