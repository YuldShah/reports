"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type DashboardRole = "admin" | "lead" | "employee"

export interface DashboardMe {
  telegramId: number
  role: DashboardRole
  teamId?: string
  name: string
  username?: string
  photoUrl?: string
}

interface SessionContextValue {
  me: DashboardMe | null
  loading: boolean
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue>({
  me: null,
  loading: true,
  logout: async () => {},
})

export const useDashboardSession = () => useContext(SessionContext)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<DashboardMe | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true
    fetch("/api/dashboard/me")
      .then(async (res) => {
        if (!active) return
        setMe(res.ok ? ((await res.json()) as DashboardMe) : null)
      })
      .catch(() => active && setMe(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/dashboard/auth/logout", { method: "POST" }).catch(() => {})
    setMe(null)
    router.replace("/dashboard/login")
  }, [router])

  return <SessionContext.Provider value={{ me, loading, logout }}>{children}</SessionContext.Provider>
}
