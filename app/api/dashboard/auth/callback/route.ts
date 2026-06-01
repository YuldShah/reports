import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { exchangeCode } from "@/lib/telegram-oauth"
import { resolveDashboardUser } from "@/lib/dashboard-data"
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OAUTH_COOKIES = ["tg_oauth_state", "tg_oauth_verifier", "tg_oauth_next"]

function redirectUriFor(req: NextRequest): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin
  return `${base}/api/dashboard/auth/callback`
}

function backToLogin(req: NextRequest, error?: string): NextResponse {
  const url = new URL("/dashboard/login", req.nextUrl.origin)
  if (error) url.searchParams.set("error", error)
  const res = NextResponse.redirect(url)
  for (const c of OAUTH_COOKIES) res.cookies.set(c, "", { path: "/", maxAge: 0 })
  return res
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams

  const oauthError = q.get("error")
  if (oauthError) return backToLogin(req, oauthError)

  const code = q.get("code")
  const state = q.get("state")
  const cookieState = req.cookies.get("tg_oauth_state")?.value
  const verifier = req.cookies.get("tg_oauth_verifier")?.value
  const next = req.cookies.get("tg_oauth_next")?.value || "/dashboard"

  if (!code || !state || !cookieState || state !== cookieState || !verifier) {
    return backToLogin(req, "invalid_state")
  }

  const claims = await exchangeCode({ code, codeVerifier: verifier, redirectUri: redirectUriFor(req) })
  if (!claims) return backToLogin(req, "token_exchange_failed")

  const telegramId = Number(claims.sub ?? claims.id)
  if (!Number.isFinite(telegramId)) return backToLogin(req, "no_subject")

  const user = await resolveDashboardUser(telegramId)
  if (!user) return backToLogin(req, "not_registered")

  const token = await createSession({
    sub: user.telegramId,
    role: user.role,
    teamId: user.teamId,
    name: user.name,
    username: user.username,
    photoUrl: user.photoUrl ?? (typeof claims.picture === "string" ? claims.picture : undefined),
  })

  const safeNext = next.startsWith("/dashboard") && !next.startsWith("//") ? next : "/dashboard"
  const res = NextResponse.redirect(new URL(safeNext, req.nextUrl.origin))
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
  for (const c of OAUTH_COOKIES) res.cookies.set(c, "", { path: "/", maxAge: 0 })
  return res
}
