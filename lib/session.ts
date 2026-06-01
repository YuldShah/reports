/**
 * Dashboard session token: a tiny signed token (`base64url(payload).base64url(hmac)`)
 * using WebCrypto HMAC-SHA256 so it can be verified BOTH in edge middleware and in
 * Node route handlers / server components. Do not import Node-only modules here.
 */

export const SESSION_COOKIE = "dash_session"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type DashboardRole = "admin" | "lead" | "employee"

export interface SessionPayload {
  sub: number // telegram id
  role: DashboardRole
  teamId?: string
  name: string
  username?: string
  photoUrl?: string
  iat: number
  exp: number
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function getSecret(): string | null {
  const secret = process.env.DASHBOARD_SESSION_SECRET
  return secret && secret.length > 0 ? secret : null
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

/** Create a signed session token. Throws if DASHBOARD_SESSION_SECRET is missing. */
export async function createSession(
  data: Omit<SessionPayload, "iat" | "exp">,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  const secret = getSecret()
  if (!secret) throw new Error("DASHBOARD_SESSION_SECRET is not configured")

  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = { ...data, iat: now, exp: now + ttlSeconds }
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)))

  const key = await importKey(secret)
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body) as BufferSource)
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`
}

/** Verify a session token. Returns the payload, or null if invalid/expired/misconfigured. */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const secret = getSecret()
  if (!secret) return null

  const dot = token.indexOf(".")
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!body || !sig) return null

  try {
    const key = await importKey(secret)
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(sig) as BufferSource,
      encoder.encode(body) as BufferSource,
    )
    if (!valid) return null

    const payload = JSON.parse(decoder.decode(base64UrlToBytes(body))) as SessionPayload
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!Number.isFinite(Number(payload.sub))) return null
    return payload
  } catch {
    return null
  }
}
