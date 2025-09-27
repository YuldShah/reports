"use client"

import type { ReactNode } from "react"
import { useAuthContext } from "@/components/auth-provider"
import LoadingSpinner from "@/components/loading-spinner"
import FallbackView from "@/components/fallback-view"
import UnregisteredView from "@/components/unregistered-view"

interface ProtectedRouteProps {
  children: ReactNode
  requireTeam?: boolean
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, requireTeam = false, adminOnly = false }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, dbUser, isAdmin, error } = useAuthContext()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !isAuthenticated) {
    return <FallbackView />
  }

  if (adminOnly && !isAdmin) {
    return <UnregisteredView />
  }

  if (requireTeam && !dbUser?.teamId && !isAdmin) {
    return <UnregisteredView />
  }

  return <>{children}</>
}
