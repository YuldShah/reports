import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { exchangeCode, type TelegramIdTokenClaims } from "@/lib/telegram-oauth"
import { resolveDashboardUser } from "@/lib/dashboard-data"
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OAUTH_COOKIES = ["tg_oauth_state", "tg_oauth_verifier", "tg_oauth_next"]

// Public base URL — behind nginx the request origin is the internal http://localhost:3002,
// so redirects must be built from the configured public URL.
function appBase(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin
}

function redirectUriFor(req: NextRequest): string {
  return `${appBase(req)}/api/dashboard/auth/callback`
}

/**
 * Find the Telegram user id among the OIDC claims. The standard `sub` claim is a large
 * opaque OpenID subject (exceeds 2^53 / Postgres bigint), so we skip anything that isn't a
 * safe integer and prefer claims that carry the raw Telegram id.
 */
function extractTelegramId(claims: TelegramIdTokenClaims): number | null {
  const candidates = [claims.id, (claims as Record<string, unknown>).telegram_id, (claims as Record<string, unknown>).user_id, claims.sub]
  for (const candidate of candidates) {
    if (candidate == null) continue
    const n = typeof candidate === "number" ? candidate : Number(String(candidate).trim())
    if (Number.isSafeInteger(n) && n > 0) return n
  }
  return null
}

function backToLogin(req: NextRequest, error?: string): NextResponse {
  const url = new URL("/dashboard/login", appBase(req))
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

  // Diagnostic: which claims did Telegram return, and which id did we resolve?
  console.log("[oauth] id_token claims:", JSON.stringify(claims))
  const telegramId = extractTelegramId(claims)
  console.log("[oauth] resolved telegramId:", telegramId)
  if (telegramId == null) return backToLogin(req, "no_subject")

  let user
  try {
    user = await resolveDashboardUser(telegramId)
  } catch (error) {
    console.error("[oauth] resolveDashboardUser failed:", error)
    return backToLogin(req, "server_error")
  }
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
  const res = NextResponse.redirect(new URL(safeNext, appBase(req)))
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
