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
    const runtimeEnv = (
      (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ) ?? {}
    const isProduction = runtimeEnv.NODE_ENV === "production"

    const showProductionFallback = (message: string) => {
      if (typeof window !== "undefined" && window.__reportsDebugAuth) {
        delete window.__reportsDebugAuth
      }

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        telegramUser: null,
        dbUser: null,
        isAdmin: false,
        error: message,
      })
    }

    const getDebugTelegramUser = (): TelegramUser => {
      const debugId = Number(runtimeEnv.NEXT_PUBLIC_DEBUG_TELEGRAM_ID || "999999")
      const debugFirstName = runtimeEnv.NEXT_PUBLIC_DEBUG_FIRST_NAME || "Browser"
      const debugLastName = runtimeEnv.NEXT_PUBLIC_DEBUG_LAST_NAME || "Debug"
      const debugUsername = runtimeEnv.NEXT_PUBLIC_DEBUG_USERNAME || "browser_debug"

      return {
        id: debugId,
        first_name: debugFirstName,
        last_name: debugLastName,
        username: debugUsername,
      }
    }

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
        setAuthState((prevState: AuthState) => {
          const updatedDbUser = prevState.dbUser
            ? { ...prevState.dbUser, role }
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
            ...prevState,
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
        const envSaysAdmin = isAdmin(telegramUser.id)

        if (response.ok) {
          const data = await response.json()
          dbUser = data.user
          console.log("[v0] Found existing user:", dbUser?.firstName)

          if (dbUser) {
            const updates: Record<string, unknown> = {}

            if (dbUser.firstName !== telegramUser.first_name) {
              updates.firstName = telegramUser.first_name
            }
            if (dbUser.lastName !== telegramUser.last_name) {
              updates.lastName = telegramUser.last_name
            }
            if (dbUser.username !== telegramUser.username) {
              updates.username = telegramUser.username
            }
            if (dbUser.photoUrl !== telegramUser.photo_url) {
              updates.photoUrl = telegramUser.photo_url
            }
            if (envSaysAdmin && dbUser.role !== "admin") {
              updates.role = "admin"
            }

            if (Object.keys(updates).length > 0) {
              console.log("[v0] Updating existing user profile")
              const updateResponse = await fetch('/api/users', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  telegramId: telegramUser.id,
                  ...updates,
                }),
              })

              if (updateResponse.ok) {
                const updateData = await updateResponse.json()
                dbUser = updateData.user
                console.log("[v0] User profile updated successfully")
              } else if (updates.role === "admin") {
                dbUser = { ...dbUser, role: "admin" }
              }
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
            if (dbUser && envSaysAdmin && dbUser.role !== "admin") {
              console.log("[v0] Elevating new user to admin role")
              const roleUpdateResponse = await fetch('/api/users', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  telegramId: telegramUser.id,
                  role: "admin",
                }),
              })

              if (roleUpdateResponse.ok) {
                const roleUpdateData = await roleUpdateResponse.json()
                dbUser = roleUpdateData.user
              } else {
                dbUser = { ...dbUser, role: "admin" }
              }
            }
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
            isAdmin: dbUser?.role === "admin" || envSaysAdmin,
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

        setAuthState((prevState: AuthState) => ({
          ...prevState,
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

          if (isProduction) {
            showProductionFallback("Telegram WebApp not detected")
            return
          }

          await authenticateWithTelegramUser(getDebugTelegramUser(), { isDebugFallback: true })
          return
        }

        console.log("[v0] Telegram WebApp initialized:", {
          version: webApp.version,
          platform: webApp.platform,
          hasInitData: !!webApp.initData,
          hasUser: !!webApp.initDataUnsafe?.user,
        })

        const telegramUser = webApp.initDataUnsafe?.user
        const hasValidInitData = typeof webApp.initData === "string" && webApp.initData.trim().length > 0

        if (!hasValidInitData || !telegramUser) {
          console.log("[v0] No valid Telegram init data - falling back")

          if (isProduction) {
            showProductionFallback("Telegram authentication required")
            return
          }

          await authenticateWithTelegramUser(getDebugTelegramUser(), { isDebugFallback: true })
          return
        }

        console.log("[v0] Telegram user authenticated:", telegramUser.first_name)
        await authenticateWithTelegramUser(telegramUser)
      } catch (error) {
        console.error("[v0] Auth initialization error:", error)
        setAuthState((prevState: AuthState) => ({
          ...prevState,
          isLoading: false,
          error: "Authentication failed",
        }))
      }
    }

    initAuth()
  }, [])

  return authState
}
