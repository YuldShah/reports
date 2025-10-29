"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import ProfileCard from "@/components/profile-card"
import Logo from "@/components/logo"
import AdminDashboard from "@/components/admin-dashboard"
import EmployeeDashboard from "@/components/employee-dashboard"

export default function HomePage() {
  const { isAdmin, dbUser } = useAuthContext()
  const detectShouldShowLogo = () => {
    if (typeof window === "undefined") {
      return true
    }

    const allowedPlatforms = ["ios", "ipad", "iphone", "android"]
    const platform = window.Telegram?.WebApp?.platform?.toLowerCase() ?? ""
    if (allowedPlatforms.some((value) => platform.includes(value))) {
      return true
    }

    const userAgent = window.navigator?.userAgent?.toLowerCase() ?? ""
    return allowedPlatforms.some((value) => userAgent.includes(value))
  }

  const [shouldShowLogo, setShouldShowLogo] = useState<boolean>(detectShouldShowLogo)

  useEffect(() => {
    setShouldShowLogo(detectShouldShowLogo())
  }, [])

  const headerPaddingTop = shouldShowLogo
    ? "calc(6px + var(--tg-safe-area-inset-top, 0px))"
    : "var(--tg-safe-area-inset-top, 0px)"
  const contentPaddingTop = shouldShowLogo ? "calc(9rem + var(--tg-safe-area-inset-top, 0px))" : "calc(6rem + var(--tg-safe-area-inset-top, 0px))" 

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border" style={{ paddingTop: headerPaddingTop }}>
          {shouldShowLogo ? <Logo /> : null}
          <ProfileCard />
        </div>

        <div className="pb-6 px-4" style={{ paddingTop: contentPaddingTop }}>
          {isAdmin ? (
            <AdminDashboard />
          ) : dbUser ? (
            <ProtectedRoute requireTeam>
              <EmployeeDashboard user={dbUser} />
            </ProtectedRoute>
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
