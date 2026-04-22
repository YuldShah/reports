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
  role: "admin" | "employee" | "lead" | string
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
  safeAreaInset?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  contentSafeAreaInset?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  isFullscreen?: boolean
  isActive?: boolean
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
    offClick?: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  onEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void
  offEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  setBottomBarColor?: (color: string) => void
  requestFullscreen?: () => Promise<void>
  lockOrientation?: (orientation: "portrait" | "landscape") => Promise<void> | void
  disableVerticalSwipes?: () => void
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
    const THEME_COLORS: Record<string, string> = {
      light: "#f9f6f1",
      dark: "#1a1814",
    }

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
      // Read the actual theme from the DOM (next-themes sets class on <html>)
      const htmlEl = document.documentElement
      const isDark = htmlEl.classList.contains("dark")
      return isDark ? THEME_COLORS.dark : THEME_COLORS.light
    }

    const applyColors = (webApp: TelegramWebApp) => {
      const color = getHeaderColor()
      try { if (typeof webApp.setHeaderColor === "function") webApp.setHeaderColor(color) } catch (e) { /* ignore */ }
      try { if (typeof webApp.setBackgroundColor === "function") webApp.setBackgroundColor(color) } catch (e) { /* ignore */ }
      try { if (typeof webApp.setBottomBarColor === "function") webApp.setBottomBarColor(color) } catch (e) { /* ignore */ }
      console.log("[v0] Telegram chrome colors set to", color, "(dark:", document.documentElement.classList.contains("dark") + ")")
    }

    // Auto-sync initial app theme with Telegram's colorScheme — only if user hasn't manually chosen one
    const syncInitialTheme = (webApp: TelegramWebApp) => {
      try {
        const tgScheme = webApp.colorScheme // "light" | "dark"
        if (!tgScheme) return
        // Respect user's manual choice — only auto-sync if nothing is saved
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) return
        const isDark = document.documentElement.classList.contains("dark")
        const appScheme = isDark ? "dark" : "light"
        if (appScheme !== tgScheme) {
          if (tgScheme === "dark") {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
          } else {
            document.documentElement.classList.remove("dark")
            document.documentElement.classList.add("light")
          }
          try { localStorage.setItem("theme", tgScheme) } catch { /* ignore */ }
          console.log("[v0] App theme synced to Telegram colorScheme:", tgScheme)
        }
      } catch (e) { /* ignore — don't break if colorScheme undefined */ }
    }

    const applyWebAppPreferences = (webApp: TelegramWebApp) => {
      try {
        // Sync app theme with Telegram's colorScheme on first load
        syncInitialTheme(webApp)

        // Apply colors immediately
        applyColors(webApp)

        // Re-apply at multiple intervals to handle fullscreen animation + desktop rendering lag
        for (const delay of [100, 300, 600, 1200, 2500]) {
          setTimeout(() => applyColors(webApp), delay)
        }

        // Re-apply when Telegram theme changes (user switches Telegram dark/light)
        if (typeof webApp.onEvent === "function") {
          webApp.onEvent("themeChanged", () => {
            applyColors(webApp)
            setTimeout(() => applyColors(webApp), 100)
          })
          // Re-apply when viewport state changes (e.g. fullscreen activated/deactivated)
          webApp.onEvent("viewportChanged", () => {
            applyColors(webApp)
            setTimeout(() => applyColors(webApp), 200)
          })
          // Re-apply when fullscreen state changes
          webApp.onEvent("fullscreenChanged", () => {
            applyColors(webApp)
            setTimeout(() => applyColors(webApp), 200)
          })
        }

        // Re-apply when app theme toggles (next-themes changes class on <html>)
        const observer = new MutationObserver(() => applyColors(webApp))
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

        // Ensure back button starts hidden on every app load
        webApp.BackButton.hide()
        console.log("[v0] Telegram BackButton hidden on init")

        const platform = webApp.platform?.toLowerCase() ?? ""
        const isMobile = platform === "android" || platform === "ios"
        if (isMobile) {
          if (typeof webApp.disableVerticalSwipes === "function") {
            try {
              webApp.disableVerticalSwipes()
              console.log("[v0] Telegram vertical swipes disabled")
            } catch (error) {
              console.warn("[v0] Unable to disable vertical swipes:", error)
            }
          }

          if (typeof webApp.requestFullscreen === "function") {
            webApp.requestFullscreen()
              .then(() => {
                // Re-apply colors once fullscreen is fully active
                applyColors(webApp)
                setTimeout(() => applyColors(webApp), 300)
              })
              .catch((error) => {
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

    let hasResolved = false

    const finish = (webApp: TelegramWebApp | null) => {
      if (hasResolved) {
        return
      }
      hasResolved = true
      clearTimeout(timeout)
      resolve(webApp)
    }

    // Set a timeout to prevent infinite waiting
    const timeout = setTimeout(() => {
      console.log("[v0] Telegram WebApp timeout - not running in Telegram")
      finish(null)
    }, 3000) // 3 second timeout

    const check = () => {
      if (hasResolved) {
        return
      }

      if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp
        console.log("[v0] Telegram WebApp found and ready")

        try {
          // Call ready() to signal that the app is ready
          webApp.ready()
        } catch (error) {
          console.warn("[v0] Telegram WebApp.ready() failed:", error)
        }

        applyWebAppPreferences(webApp)
        finish(webApp)
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
  // Next.js only inlines NEXT_PUBLIC_* when accessed as literal process.env.NEXT_PUBLIC_X
  // Dynamic access via env[key] does NOT get replaced at build time
  const inlinedPublicIds = process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS ?? ""
  
  const env = getEnv()
  const serverIds = env.ADMIN_TELEGRAM_IDS ?? env.ADMIN_TELEGRAM_ID ?? ""

  const raw = [inlinedPublicIds, serverIds]
    .filter(Boolean)
    .join(",")

  if (!raw) {
    return []
  }

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
