import { type NextRequest, NextResponse } from "next/server"
import { getAllTeams, createTeam, getTeamById, getUsersByTeam } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("id")

    if (teamId) {
      const team = getTeamById(teamId)
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
      }

      const members = getUsersByTeam(teamId)
      return NextResponse.json({ team: { ...team, members } })
    }

    const teams = getAllTeams()
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

    const team = createTeam({
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
