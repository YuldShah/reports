import type React from "react"
import AuthProvider from "@/components/auth-provider"

// Browser-debug playground. The debug fallback (open the app outside Telegram with a
// switchable role) is enabled ONLY when NEXT_PUBLIC_BROWSER_DEBUG_AUTH === "true".
// When the flag is off, this route behaves like the locked-down root (Telegram required).
export default function DebugLayout({ children }: { children: React.ReactNode }) {
  const allowDebug = process.env.NEXT_PUBLIC_BROWSER_DEBUG_AUTH === "true"
  return <AuthProvider allowDebug={allowDebug}>{children}</AuthProvider>
}
