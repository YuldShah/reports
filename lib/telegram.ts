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

const parseAdminTelegramIds = (): number[] => {
  const env = getEnv()
  const raw =
    env.ADMIN_TELEGRAM_IDS?.trim() ||
    env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS?.trim() ||
    env.ADMIN_TELEGRAM_ID?.trim() ||
    env.NEXT_PUBLIC_ADMIN_TELEGRAM_ID?.trim() ||
    ""

  if (!raw) {
    return []
  }

  return raw
    .split(/[,\s]+/)
    .map((value: string) => value.trim())
    .filter((value: string) => Boolean(value))
    .map((value: string) => Number.parseInt(value, 10))
    .filter((value: number) => Number.isFinite(value))
}

const ADMIN_TELEGRAM_ID_LIST = parseAdminTelegramIds()
const ADMIN_TELEGRAM_ID_SET = new Set(ADMIN_TELEGRAM_ID_LIST)

export const getAdminTelegramIds = (): number[] => [...ADMIN_TELEGRAM_ID_LIST]

export const isAdmin = (userId: number): boolean => ADMIN_TELEGRAM_ID_SET.has(Number(userId))

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
