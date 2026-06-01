import crypto from "crypto"

/**
 * Telegram OAuth 2.0 / OpenID Connect (the "Login Widget 2" flow).
 * Authorization-code flow with PKCE. The client secret is used only here,
 * server-side, for the token exchange — it never reaches the browser.
 *
 * Docs: https://core.telegram.org/bots/telegram-login
 */

const AUTH_ENDPOINT = "https://oauth.telegram.org/auth"
const TOKEN_ENDPOINT = "https://oauth.telegram.org/token"
export const OAUTH_SCOPE = "openid profile"

export function getOAuthConfig(): { clientId: string; clientSecret: string } {
  // client_id is the bot's numeric id; fall back to the bot-token prefix.
  const clientId =
    process.env.TELEGRAM_OAUTH_CLIENT_ID || (process.env.TELEGRAM_BOT_TOKEN?.split(":")[0] ?? "")
  const clientSecret = process.env.TELEGRAM_OAUTH_CLIENT_SECRET || ""
  return { clientId, clientSecret }
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest())
  return { verifier, challenge }
}

export function randomState(): string {
  return base64url(crypto.randomBytes(16))
}

export function buildAuthUrl(params: {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  scope?: string
}): string {
  const url = new URL(AUTH_ENDPOINT)
  url.searchParams.set("client_id", params.clientId)
  url.searchParams.set("redirect_uri", params.redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", params.scope ?? OAUTH_SCOPE)
  url.searchParams.set("state", params.state)
  url.searchParams.set("code_challenge", params.codeChallenge)
  url.searchParams.set("code_challenge_method", "S256")
  return url.toString()
}

export interface TelegramIdTokenClaims {
  sub?: string | number
  id?: string | number
  name?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  picture?: string
  phone_number?: string
  [key: string]: unknown
}

/** Decode (without signature check) a JWT payload received directly from the token endpoint. */
export function decodeIdToken(idToken: string): TelegramIdTokenClaims | null {
  const parts = idToken.split(".")
  if (parts.length < 2) return null
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4)
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as TelegramIdTokenClaims
  } catch {
    return null
  }
}

/**
 * Exchange an authorization code for the ID token claims.
 * The id_token is received directly from Telegram's token endpoint over TLS,
 * so it is trusted without separate signature verification (standard for the
 * confidential-client authorization-code flow).
 */
export async function exchangeCode(params: {
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<TelegramIdTokenClaims | null> {
  const { clientId, clientSecret } = getOAuthConfig()
  if (!clientId || !clientSecret) return null

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: clientId,
    code_verifier: params.codeVerifier,
  })
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  let res: Response
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    })
  } catch (error) {
    console.error("Telegram token request errored:", error)
    return null
  }

  if (!res.ok) {
    console.error("Telegram token exchange failed:", res.status, await res.text().catch(() => ""))
    return null
  }

  const json = (await res.json().catch(() => null)) as { id_token?: string } | null
  if (!json?.id_token) return null
  return decodeIdToken(json.id_token)
}
