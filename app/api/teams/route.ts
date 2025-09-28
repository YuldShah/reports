import { type NextRequest, NextResponse } from "next/server"
import { getAllTeams, createTeam, getTeamById, getUsersByTeam, deleteTeam, updateTeamTemplate } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("id")

    if (teamId) {
      const team = await getTeamById(teamId)
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
      }

      const members = await getUsersByTeam(teamId)
      return NextResponse.json({ team: { ...team, members } })
    }

    const teams = await getAllTeams()
    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, createdBy } = body

    if (!name || !createdBy) {
      return NextResponse.json({ error: "Team name and creator ID are required" }, { status: 400 })
    }

    const team = await createTeam({
      name,
      description: description || "",
      createdBy,
    })

    return NextResponse.json({ team }, { status: 201 })
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
    const { teamId, templateId } = body

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    const updatedTeam = await updateTeamTemplate(teamId, templateId)
    
    if (!updatedTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}
