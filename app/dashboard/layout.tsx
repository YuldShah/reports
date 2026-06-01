import type React from "react"
import type { Metadata } from "next"
import { SessionProvider } from "@/components/dashboard/session-provider"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Reports Dashboard",
  description: "Analytics and report browsing dashboard",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mesh">
      <SessionProvider>
        <DashboardShell>{children}</DashboardShell>
      </SessionProvider>
    </div>
  )
}
