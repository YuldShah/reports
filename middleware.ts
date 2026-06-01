import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/session"

// Endpoints that must stay reachable without a session so the login flow can run.
const PUBLIC_DASHBOARD_PATHS = new Set<string>(["/dashboard/login"])

function isPublicApi(pathname: string): boolean {
  // OAuth start + callback + logout must work without (or before) a valid session
  return (
    pathname === "/api/dashboard/auth/login" ||
    pathname === "/api/dashboard/auth/callback" ||
    pathname === "/api/dashboard/auth/logout"
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith("/api/dashboard")

  if (PUBLIC_DASHBOARD_PATHS.has(pathname) || isPublicApi(pathname)) {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)

  if (session) return NextResponse.next()

  if (isApi) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = "/dashboard/login"
  url.search = ""
  if (pathname !== "/dashboard") url.searchParams.set("next", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
}
