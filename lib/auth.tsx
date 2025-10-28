"use client"

import { useEffect, useState } from "react"

import { isAdmin, waitForTelegram } from "@/lib/telegram"
import type { TelegramUser, User } from "@/lib/telegram"

declare global {
  interface Window {
    __reportsDebugAuth?: {
      setRole: (role: "admin" | "employee") => void
      getRole: () => "admin" | "employee"
    }
  }
}

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
    const getStoredDebugRole = (): "admin" | "employee" => {
      if (typeof window === "undefined") return "employee"
      return window.localStorage?.getItem("reportsDebugRole") === "admin" ? "admin" : "employee"
    }

    const persistDebugRole = (role: "admin" | "employee") => {
      if (typeof window === "undefined") return
      try {
        window.localStorage?.setItem("reportsDebugRole", role)
      } catch (error) {
        console.warn("[v0] Unable to persist debug role:", error)
      }
    }

    const registerDebugRoleController = (telegramUser: TelegramUser) => {
      if (typeof window === "undefined") return

      const applyRole = (role: "admin" | "employee") => {
        persistDebugRole(role)
        setAuthState((prev) => {
          if (!prev) return prev
          const updatedDbUser = prev.dbUser
            ? { ...prev.dbUser, role }
            : {
                telegramId: telegramUser.id,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name,
                username: telegramUser.username,
                photoUrl: telegramUser.photo_url,
                teamId: undefined,
                role,
                createdAt: new Date(),
              }
          return {
            ...prev,
            dbUser: updatedDbUser,
            isAdmin: role === "admin",
          }
        })
      }

      window.__reportsDebugAuth = {
        setRole: (role: "admin" | "employee") => {
          if (role !== "admin" && role !== "employee") {
            console.warn('[v0] Debug auth: role must be "admin" or "employee"')
            return
          }
          console.log(`[v0] Debug auth: switching role to ${role}`)
          applyRole(role)
        },
        getRole: () =>
          window.localStorage?.getItem("reportsDebugRole") === "admin" ? "admin" : "employee",
      }

      console.info('[v0] Debug auth ready: window.__reportsDebugAuth.setRole("admin" | "employee")')
    }
    const authenticateWithTelegramUser = async (
      telegramUser: TelegramUser,
      { isDebugFallback = false }: { isDebugFallback?: boolean } = {},
    ) => {
      try {
        console.log("[v0] Authenticating Telegram user:", telegramUser.first_name)

        // Check if user exists in database via API
        const response = await fetch(`/api/users?telegramId=${telegramUser.id}`)
        let dbUser: User | null = null

        if (response.ok) {
          const data = await response.json()
          dbUser = data.user
          console.log("[v0] Found existing user:", dbUser?.firstName)

          // Update existing user with latest profile info (including photo)
          if (
            dbUser &&
            (
              dbUser.firstName !== telegramUser.first_name ||
              dbUser.lastName !== telegramUser.last_name ||
              dbUser.username !== telegramUser.username ||
              dbUser.photoUrl !== telegramUser.photo_url
            )
          ) {
            console.log("[v0] Updating existing user profile")
            const updateResponse = await fetch('/api/users', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telegramId: telegramUser.id,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name,
                username: telegramUser.username,
                photoUrl: telegramUser.photo_url,
              }),
            })

            if (updateResponse.ok) {
              const updateData = await updateResponse.json()
              dbUser = updateData.user
              console.log("[v0] User profile updated successfully")
            }
          }
        } else if (response.status === 404) {
          // User doesn't exist, create them
          console.log("[v0] Auto-registering new user")
          const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              telegramId: telegramUser.id,
              firstName: telegramUser.first_name,
              lastName: telegramUser.last_name,
              username: telegramUser.username,
              photoUrl: telegramUser.photo_url,
            }),
          })

          if (createResponse.ok) {
            const createData = await createResponse.json()
            dbUser = createData.user
            console.log("[v0] User created successfully:", dbUser?.firstName)
          } else {
            throw new Error('Failed to create user')
          }
        } else {
          throw new Error('Failed to check user')
        }

        console.log("[v0] Authentication successful")

        if (isDebugFallback) {
          const debugRole = getStoredDebugRole()
          persistDebugRole(debugRole)
          const fallbackUser: User = dbUser
            ? { ...dbUser, role: debugRole }
            : {
                telegramId: telegramUser.id,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name,
                username: telegramUser.username,
                photoUrl: telegramUser.photo_url,
                teamId: undefined,
                role: debugRole,
                createdAt: new Date(),
              }

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            telegramUser,
            dbUser: fallbackUser,
            isAdmin: debugRole === "admin",
            error: null,
          })

          registerDebugRoleController(telegramUser)
        } else {
          if (typeof window !== "undefined" && window.__reportsDebugAuth) {
            delete window.__reportsDebugAuth
          }

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            telegramUser,
            dbUser,
            isAdmin: isAdmin(telegramUser.id),
            error: null,
          })
        }
      } catch (apiError) {
        console.error("[v0] API error during auth:", apiError)

        if (isDebugFallback) {
          console.log("[v0] Falling back to local debug auth state")
          const debugRole = getStoredDebugRole()
          persistDebugRole(debugRole)
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            telegramUser,
            dbUser: {
              telegramId: telegramUser.id,
              firstName: telegramUser.first_name,
              lastName: telegramUser.last_name,
              username: telegramUser.username,
              photoUrl: telegramUser.photo_url,
              teamId: undefined,
              role: debugRole,
              createdAt: new Date(),
            },
            isAdmin: debugRole === "admin",
            error: null,
          })

          registerDebugRoleController(telegramUser)
          return
        }

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to authenticate with server",
        }))
      }
    }

    const initAuth = async () => {
      try {
        console.log("[v0] Starting auth initialization...")

        const webApp = await waitForTelegram()

        if (!webApp) {
          console.log("[v0] Telegram WebApp not detected - using debug browser authentication")

          const debugId = Number(process.env.NEXT_PUBLIC_DEBUG_TELEGRAM_ID || "999999")
          const debugFirstName = process.env.NEXT_PUBLIC_DEBUG_FIRST_NAME || "Browser"
          const debugLastName = process.env.NEXT_PUBLIC_DEBUG_LAST_NAME || "Debug"
          const debugUsername = process.env.NEXT_PUBLIC_DEBUG_USERNAME || "browser_debug"

          const debugUser: TelegramUser = {
            id: debugId,
            first_name: debugFirstName,
            last_name: debugLastName,
            username: debugUsername,
          }

          await authenticateWithTelegramUser(debugUser, { isDebugFallback: true })
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
          console.log("[v0] No user data available - falling back to debug mode")

          const debugId = Number(process.env.NEXT_PUBLIC_DEBUG_TELEGRAM_ID || "999999")
          const debugFirstName = process.env.NEXT_PUBLIC_DEBUG_FIRST_NAME || "Browser"
          const debugLastName = process.env.NEXT_PUBLIC_DEBUG_LAST_NAME || "Debug"
          const debugUsername = process.env.NEXT_PUBLIC_DEBUG_USERNAME || "browser_debug"

          const debugUser: TelegramUser = {
            id: debugId,
            first_name: debugFirstName,
            last_name: debugLastName,
            username: debugUsername,
          }

          await authenticateWithTelegramUser(debugUser, { isDebugFallback: true })
          return
        }

        console.log("[v0] Telegram user authenticated:", telegramUser.first_name)
        await authenticateWithTelegramUser(telegramUser)
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
