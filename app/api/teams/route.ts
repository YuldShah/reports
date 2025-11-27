import { type NextRequest, NextResponse } from "next/server"
import { 
  getAllTeams, 
  createTeam, 
  getTeamById, 
  getUsersByTeam, 
  deleteTeam, 
  setTeamTemplates,
  getTeamTemplates,
  getTemplatesByTeamId,
} from "@/lib/database"
import { ensureStaticTemplatesSynced } from "@/lib/report-templates"

export async function GET(request: NextRequest) {
  try {
    await ensureStaticTemplatesSynced()
    
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("id")

    if (teamId) {
      const team = await getTeamById(teamId)
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
      }

      const members = await getUsersByTeam(teamId)
      const templateIds = await getTemplatesByTeamId(teamId)
      const templates = await getTeamTemplates(teamId)
      
      return NextResponse.json({ 
        team: { 
          ...team, 
          members,
          templateIds,
          templates: templates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            fields: t.questions,
            createdAt: t.createdAt,
          })),
        } 
      })
    }

    const teams = await getAllTeams()
    
    // Fetch template IDs for each team
    const teamsWithTemplates = await Promise.all(
      teams.map(async (team) => {
        const templateIds = await getTemplatesByTeamId(team.id)
        return {
          ...team,
          templateIds,
        }
      })
    )
    
    return NextResponse.json({ teams: teamsWithTemplates })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, createdBy, templateIds } = body

    if (!name || !createdBy) {
      return NextResponse.json({ error: "Team name and creator ID are required" }, { status: 400 })
    }

    const team = await createTeam({
      name,
      description: description || "",
      createdBy,
    })

    // If templateIds provided, assign them to the team
    if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
      await setTeamTemplates(team.id, templateIds)
    }

    const assignedTemplateIds = await getTemplatesByTeamId(team.id)

    return NextResponse.json({ 
      team: {
        ...team,
        templateIds: assignedTemplateIds,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("id")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    const success = await deleteTeam(teamId)
    
    if (!success) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, templateIds } = body

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    await ensureStaticTemplatesSynced()

    // Handle templateIds as an array for multiple template support
    if (templateIds !== undefined) {
      if (!Array.isArray(templateIds)) {
        return NextResponse.json({ error: "templateIds must be an array" }, { status: 400 })
      }
      
      await setTeamTemplates(teamId, templateIds)
    }

    const team = await getTeamById(teamId)
    
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const assignedTemplateIds = await getTemplatesByTeamId(teamId)

    return NextResponse.json({ 
      team: {
        ...team,
        templateIds: assignedTemplateIds,
      }
    })
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}
