import { NextRequest, NextResponse } from "next/server"
import { ensureStaticTemplatesSynced } from "@/lib/report-templates"
import { 
  getAllTemplates as getAllDbTemplates, 
  getTemplateById as getDbTemplateById,
  createTemplate as createDbTemplate,
  updateTemplate as updateDbTemplate,
  deleteTemplate as deleteDbTemplate,
} from "@/lib/database"
import { randomUUID } from "crypto"

export async function GET(request: NextRequest) {
  try {
    await ensureStaticTemplatesSynced()

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")

    if (templateId) {
      const template = await getDbTemplateById(templateId)
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      // Map questions to fields for frontend compatibility
      return NextResponse.json({ 
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          fields: template.questions,
          createdAt: template.createdAt,
          createdBy: template.createdBy,
        }
      })
    }

    const templates = await getAllDbTemplates()
    // Map questions to fields for frontend compatibility
    const mappedTemplates = templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      fields: t.questions,
      createdAt: t.createdAt,
      createdBy: t.createdBy,
    }))
    return NextResponse.json({ templates: mappedTemplates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureStaticTemplatesSynced()
    
    const body = await request.json()
    const { name, description, fields, createdBy } = body

    if (!name || !fields || !Array.isArray(fields)) {
      return NextResponse.json({ 
        error: "Template name and fields array are required" 
      }, { status: 400 })
    }

    // Validate fields structure
    for (const field of fields) {
      if (!field.id || !field.label || !field.type) {
        return NextResponse.json({ 
          error: "Each field must have id, label, and type" 
        }, { status: 400 })
      }
      if (!['text', 'number', 'date', 'textarea', 'select'].includes(field.type)) {
        return NextResponse.json({ 
          error: `Invalid field type: ${field.type}. Must be one of: text, number, date, textarea, select` 
        }, { status: 400 })
      }
    }

    const templateId = randomUUID()
    const template = await createDbTemplate({
      id: templateId,
      name,
      description: description || null,
      questions: fields,
      createdBy: createdBy || null,
    })

    return NextResponse.json({ 
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        fields: template.questions,
        createdAt: template.createdAt,
        createdBy: template.createdBy,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureStaticTemplatesSynced()
    
    const body = await request.json()
    const { id, name, description, fields } = body

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (fields !== undefined) {
      // Validate fields structure
      if (!Array.isArray(fields)) {
        return NextResponse.json({ error: "Fields must be an array" }, { status: 400 })
      }
      for (const field of fields) {
        if (!field.id || !field.label || !field.type) {
          return NextResponse.json({ 
            error: "Each field must have id, label, and type" 
          }, { status: 400 })
        }
      }
      updates.questions = fields
    }

    const template = await updateDbTemplate(id, updates)
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        fields: template.questions,
        createdAt: template.createdAt,
        createdBy: template.createdBy,
      }
    })
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("id")

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    const success = await deleteDbTemplate(templateId)
    
    if (!success) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
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

    // This endpoint is deprecated - use /api/teams PATCH instead
    // Keeping for backward compatibility
    const { updateTeamTemplate } = await import("@/lib/database")
    
    let resolvedTemplateId: string | null = null

    if (templateId) {
      const template = await getDbTemplateById(templateId)
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