"use client"

import { useAuthContext } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import ProfileCard from "@/components/profile-card"
import Logo from "@/components/logo"
import AdminDashboard from "@/components/admin-dashboard"
import EmployeeDashboard from "@/components/employee-dashboard"

export default function HomePage() {
  const { isAdmin, dbUser } = useAuthContext()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border pt-8">
          <Logo />
          <ProfileCard />
        </div>

        <div className="pt-44 pb-6 px-4">
          {isAdmin ? (
            <AdminDashboard />
          ) : (
            <ProtectedRoute requireTeam>
              <EmployeeDashboard user={dbUser} />
            </ProtectedRoute>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
