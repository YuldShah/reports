import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers, getUserByTelegramId, updateUser, createUser } from "@/lib/database"
import { isAdmin } from "@/lib/telegram"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get("telegramId")

    if (telegramId) {
      const user = getUserByTelegramId(Number(telegramId))
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ user })
    }

    const users = getAllUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId, firstName, lastName, username, photoUrl } = body

    if (!telegramId || !firstName) {
      return NextResponse.json({ error: "Telegram ID and first name are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = getUserByTelegramId(telegramId)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const user = createUser({
      telegramId,
      firstName,
      lastName,
      username,
      photoUrl,
      role: isAdmin(telegramId) ? "admin" : "employee",
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId, ...updates } = body

    if (!telegramId) {
      return NextResponse.json({ error: "Telegram ID is required" }, { status: 400 })
    }

    const updatedUser = updateUser(telegramId, updates)

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
