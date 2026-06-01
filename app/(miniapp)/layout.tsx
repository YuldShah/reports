import type React from "react"
import AuthProvider from "@/components/auth-provider"

// The Telegram mini app lives under this route group so that the Telegram
// WebApp AuthProvider only wraps the mini app — not the browser dashboard
// under /dashboard. The Telegram SDK <script> itself stays in the root layout
// <head> so the mini app's load timing is unchanged.
export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
