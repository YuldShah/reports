import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { buildAuthUrl, generatePkce, getOAuthConfig, randomState } from "@/lib/telegram-oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OAUTH_COOKIE_OPTS = (secure: boolean) =>
  ({ httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 600 })

function appBase(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin
}

function redirectUriFor(req: NextRequest): string {
  return `${appBase(req)}/api/dashboard/auth/callback`
}

export function GET(req: NextRequest) {
  const { clientId, clientSecret } = getOAuthConfig()
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/dashboard/login?error=oauth_not_configured", appBase(req)))
  }

  const { verifier, challenge } = generatePkce()
  const state = randomState()
  const nextParam = req.nextUrl.searchParams.get("next")
  const next = nextParam && nextParam.startsWith("/dashboard") && !nextParam.startsWith("//") ? nextParam : "/dashboard"

  const authUrl = buildAuthUrl({
    clientId,
    redirectUri: redirectUriFor(req),
    state,
    codeChallenge: challenge,
  })

  const res = NextResponse.redirect(authUrl)
  const secure = process.env.NODE_ENV === "production"
  res.cookies.set("tg_oauth_state", state, OAUTH_COOKIE_OPTS(secure))
  res.cookies.set("tg_oauth_verifier", verifier, OAUTH_COOKIE_OPTS(secure))
  res.cookies.set("tg_oauth_next", next, OAUTH_COOKIE_OPTS(secure))
  return res
}
