import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  return NextResponse.json({
    telegramId: session.sub,
    role: session.role,
    teamId: session.teamId,
    name: session.name,
    username: session.username,
    photoUrl: session.photoUrl,
  })
}
