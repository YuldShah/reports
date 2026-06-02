import { NextResponse } from "next/server"
import { getServerSession, resolveScope } from "@/lib/dashboard-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  // Role/teams resolved live from the DB so lead/team changes take effect without re-login.
  const scope = await resolveScope(session.sub)
  return NextResponse.json({
    telegramId: session.sub,
    role: scope.role,
    teamIds: scope.teamIds,
    name: session.name,
    username: session.username,
    photoUrl: session.photoUrl,
  })
}
