"use client"

import { useEffect } from "react"

import { useState } from "react"

import { isAdmin, waitForTelegram } from "@/lib/telegram"
import { getUserByTelegramId, createUser } from "@/lib/database"
import type { TelegramUser, User } from "@/lib/telegram"

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  telegramUser: TelegramUser | null
  dbUser: User | null
  isAdmin: boolean
  error: string | null
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    telegramUser: null,
    dbUser: null,
    isAdmin: false,
    error: null,
  })

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("[v0] Starting auth initialization...")

        const webApp = await waitForTelegram()

        if (!webApp) {
          console.log("[v0] Not running in Telegram - showing fallback")
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Not running in Telegram",
          }))
          return
        }

        console.log("[v0] Telegram WebApp initialized:", {
          version: webApp.version,
          platform: webApp.platform,
          hasInitData: !!webApp.initData,
          hasUser: !!webApp.initDataUnsafe?.user,
        })

        const telegramUser = webApp.initDataUnsafe?.user

        if (!telegramUser) {
          console.log("[v0] No user data available")
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: "No user data available",
          }))
          return
        }

        console.log("[v0] Telegram user authenticated:", telegramUser.first_name)

        // Check if user exists in database
        let dbUser = getUserByTelegramId(telegramUser.id)

        if (!dbUser) {
          // Auto-register user
          console.log("[v0] Auto-registering new user")
          dbUser = createUser({
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
            photoUrl: telegramUser.photo_url,
            role: isAdmin(telegramUser.id) ? "Admin" : "Unknown",
          })
        }

        console.log("[v0] Authentication successful")
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          telegramUser,
          dbUser,
          isAdmin: isAdmin(telegramUser.id),
          error: null,
        })
      } catch (error) {
        console.error("[v0] Auth initialization error:", error)
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Authentication failed",
        }))
      }
    }

    initAuth()
  }, [])

  return authState
}

// Bot response handlers
export const handleBotCommand = async (chatId: number, command: string, userId: number) => {
  const { sendTelegramMessage } = await import("@/lib/telegram")

  try {
    if (command === "/start") {
      const user = getUserByTelegramId(userId)

      if (isAdmin(userId)) {
        // Admin response with inline button
        await sendTelegramMessage(chatId, "Welcome, Admin! You can open the admin dashboard using this button:", {
          inline_keyboard: [
            [
              {
                text: "📊 Open Admin Dashboard",
                web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app" },
              },
            ],
          ],
        })
      } else if (user && user.teamId) {
        // Registered employee with team
        await sendTelegramMessage(chatId, "Welcome! You can submit a report using this button:", {
          inline_keyboard: [
            [
              {
                text: "📝 Submit Report",
                web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app" },
              },
            ],
          ],
        })
      } else {
        // Unregistered user
        await sendTelegramMessage(
          chatId,
          `You're not registered in the system yet. Please contact your administrator to assign you to a team.\n\nYour Telegram ID: <code>${userId}</code>`,
        )
      }
    }
  } catch (error) {
    console.error("Error handling bot command:", error)
    await sendTelegramMessage(chatId, "Sorry, something went wrong. Please try again later.")
  }
}
