"use client"

import { useAuthContext } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import ProfileCard from "@/components/profile-card"
import Logo from "@/components/logo"
import AdminDashboard from "@/components/admin-dashboard"
import EmployeeDashboard from "@/components/employee-dashboard"

export default function HomePage() {
  const { isAdmin, dbUser } = useAuthContext()
  const headerPaddingTop = "calc(2rem + var(--tg-safe-area-inset-top, 0px))"
  const contentPaddingTop = "calc(11rem + var(--tg-safe-area-inset-top, 0px))"

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border" style={{ paddingTop: headerPaddingTop }}>
          <Logo />
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
