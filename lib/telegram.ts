export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface User {
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  teamId?: string
  role: "admin" | "employee"
  createdAt: Date
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    chat_instance?: string
    chat_type?: string
    start_param?: string
  }
  version: string
  platform: string
  colorScheme: "light" | "dark"
  themeParams: any
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
  }
  BackButton: {
    isVisible: boolean
    onClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  setHeaderColor?: (color: string) => void
  requestFullscreen?: () => Promise<void>
  lockOrientation?: (orientation: "portrait" | "landscape") => Promise<void> | void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export const waitForTelegram = async (): Promise<TelegramWebApp | null> => {
  return new Promise((resolve) => {
    // If not in browser, resolve immediately with null
    if (typeof window === "undefined") {
      resolve(null)
      return
    }
    const DEFAULT_HEADER_COLOR = "#10161f"

    const normalizeColorHex = (value: string): string | null => {
      if (!value) return null
      const rgbMatch = value.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i)
      if (!rgbMatch) {
        const hexMatch = value.match(/#([0-9a-f]{3,8})/i)
        if (!hexMatch) return null

        const hex = hexMatch[1]
        if (hex.length === 3) {
          return `#${hex
            .split("")
            .map((char) => char.repeat(2))
            .join("")}`
        }

        return `#${hex.substring(0, 6)}`
      }

      const [, r, g, b] = rgbMatch
      const toHex = (channel: string) => {
        const num = Number(channel)
        if (!Number.isFinite(num)) return "00"
        return Math.max(0, Math.min(255, num))
          .toString(16)
          .padStart(2, "0")
      }

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    const getHeaderColor = (): string => {
      try {
        const doc = window.document
        const body = doc.body
        if (!body) {
          return DEFAULT_HEADER_COLOR
        }
        const color = window.getComputedStyle(body).backgroundColor
        return normalizeColorHex(color) ?? DEFAULT_HEADER_COLOR
      } catch (error) {
        console.warn("[v0] Unable to derive header color:", error)
        return DEFAULT_HEADER_COLOR
      }
    }

    const applyWebAppPreferences = (webApp: TelegramWebApp) => {
      try {
        const headerColor = getHeaderColor()
        if (typeof webApp.setHeaderColor === "function") {
          webApp.setHeaderColor(headerColor)
          console.log("[v0] Telegram header color set to", headerColor)
        }

        const platform = webApp.platform?.toLowerCase() ?? ""
        const isMobile = platform === "android" || platform === "ios"
        if (isMobile) {
          if (typeof webApp.requestFullscreen === "function") {
            webApp.requestFullscreen().catch((error) => {
              console.warn("[v0] Unable to request fullscreen:", error)
            })
          }

          if (typeof webApp.lockOrientation === "function") {
            const lockResult = webApp.lockOrientation("portrait")
            if (lockResult instanceof Promise) {
              lockResult.catch((error) => {
                console.warn("[v0] Unable to lock orientation:", error)
              })
            }
          }
        }
      } catch (error) {
        console.warn("[v0] Failed to apply Telegram WebApp preferences:", error)
      }
    }

    // Set a timeout to prevent infinite waiting
    const timeout = setTimeout(() => {
      console.log("[v0] Telegram WebApp timeout - not running in Telegram")
      resolve(null)
    }, 3000) // 3 second timeout

    const check = () => {
      if (window.Telegram?.WebApp) {
        clearTimeout(timeout)
        console.log("[v0] Telegram WebApp found and ready")
        // Call ready() to signal that the app is ready
        window.Telegram.WebApp.ready()
        applyWebAppPreferences(window.Telegram.WebApp)
        resolve(window.Telegram.WebApp)
      } else {
        // Keep checking until available or timeout
        requestAnimationFrame(check)
      }
    }

    check()
  })
}

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

export const getTelegramUser = (): TelegramUser | null => {
  const webApp = getTelegramWebApp()
  return webApp?.initDataUnsafe?.user || null
}

export const isRunningInTelegram = (): boolean => {
  if (typeof window === "undefined") return false
  return !!window.Telegram?.WebApp
}

type GlobalWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}

const getEnv = (): Record<string, string | undefined> => {
  const env = (globalThis as GlobalWithProcess).process?.env
  return env ?? {}
}

const ADMIN_ENV_KEYS = [
  "ADMIN_TELEGRAM_IDS",
  "NEXT_PUBLIC_ADMIN_TELEGRAM_IDS",
  "ADMIN_TELEGRAM_ID",
  "NEXT_PUBLIC_ADMIN_TELEGRAM_ID",
] as const

let cachedAdminIds: number[] | null = null
let cachedAdminSignature: string | null = null

const parseAdminTelegramIds = (): number[] => {
  const env = getEnv()

  const normalizedValues = ADMIN_ENV_KEYS
    .map((key) => env[key]?.trim())
    .filter((value): value is string => Boolean(value && value.length > 0))

  if (normalizedValues.length === 0) {
    return []
  }

  const raw = normalizedValues.join(",")

  const parsedIds = raw
    .split(/[\,\s]+/)
    .map((value: string) => value.trim())
    .filter((value: string) => Boolean(value))
    .map((value: string) => Number.parseInt(value, 10))
    .filter((value: number) => Number.isFinite(value))

  return Array.from(new Set(parsedIds))
}

const getAdminIdsInternal = (): number[] => {
  const env = getEnv()
  const signature = ADMIN_ENV_KEYS.map((key) => env[key]?.trim() ?? "").join("|")

  if (cachedAdminIds && cachedAdminSignature === signature) {
    return cachedAdminIds
  }

  cachedAdminIds = parseAdminTelegramIds()
  cachedAdminSignature = signature

  return cachedAdminIds
}

export const getAdminTelegramIds = (): number[] => [...getAdminIdsInternal()]

export const isAdmin = (userId: number): boolean => {
  const adminIds = getAdminIdsInternal()
  const numericId = Number(userId)

  if (!Number.isFinite(numericId)) {
    return false
  }

  return adminIds.includes(numericId)
}

// Bot API functions
export const sendTelegramMessage = async (chatId: number, text: string, replyMarkup?: any) => {
  const botToken = getEnv().TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set")
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: "HTML",
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Telegram API error:", response.status, errorText)
    throw new Error(`Failed to send message: ${response.statusText}`)
  }

  return response.json()
}
