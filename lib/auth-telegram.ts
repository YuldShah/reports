import crypto from "crypto"

/**
 * Server-side verification of Telegram authentication payloads.
 *
 * Two flavours:
 *  - verifyLoginWidget: the browser "Login with Telegram" widget payload.
 *  - verifyInitData:     the Telegram Mini App `initData` query string.
 *
 * Both run only in Node route handlers (they use the Node `crypto` module).
 * Docs: https://core.telegram.org/widgets/login#checking-authorization
 *       https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */

export interface TelegramLoginPayload {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
  [key: string]: unknown
}

export interface TelegramAuthUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

const DAY_SECONDS = 86400

function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  } catch {
    return false
  }
}

/** Verify a Telegram Login Widget payload. Returns the clean user on success, else null. */
export function verifyLoginWidget(
  payload: Record<string, unknown>,
  botToken: string,
  maxAgeSeconds: number = DAY_SECONDS,
): TelegramAuthUser | null {
  if (!botToken) return null
  const hash = typeof payload.hash === "string" ? payload.hash : ""
  if (!hash) return null

  const checkString = Object.keys(payload)
    .filter((key) => key !== "hash" && payload[key] !== undefined && payload[key] !== null)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join("\n")

  const secret = crypto.createHash("sha256").update(botToken).digest()
  const computed = crypto.createHmac("sha256", secret).update(checkString).digest("hex")
  if (!timingSafeEqualHex(computed, hash)) return null

  const authDate = Number(payload.auth_date)
  if (maxAgeSeconds && (Number.isNaN(authDate) || Date.now() / 1000 - authDate > maxAgeSeconds)) {
    return null
  }

  const id = Number(payload.id)
  if (!Number.isFinite(id)) return null

  return {
    id,
    first_name: typeof payload.first_name === "string" ? payload.first_name : undefined,
    last_name: typeof payload.last_name === "string" ? payload.last_name : undefined,
    username: typeof payload.username === "string" ? payload.username : undefined,
    photo_url: typeof payload.photo_url === "string" ? payload.photo_url : undefined,
  }
}

/** Verify a Telegram Mini App initData string. Returns the embedded user on success, else null. */
export function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = DAY_SECONDS,
): TelegramAuthUser | null {
  if (!botToken || !initData) return null

  const params = new URLSearchParams(initData)
  const hash = params.get("hash") ?? ""
  if (!hash) return null
  params.delete("hash")

  const checkString = Array.from(params.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n")

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const computed = crypto.createHmac("sha256", secret).update(checkString).digest("hex")
  if (!timingSafeEqualHex(computed, hash)) return null

  const authDate = Number(params.get("auth_date"))
  if (maxAgeSeconds && (Number.isNaN(authDate) || Date.now() / 1000 - authDate > maxAgeSeconds)) {
    return null
  }

  const userRaw = params.get("user")
  if (!userRaw) return null
  try {
    const user = JSON.parse(userRaw) as TelegramAuthUser
    if (!Number.isFinite(Number(user.id))) return null
    return user
  } catch {
    return null
  }
}
