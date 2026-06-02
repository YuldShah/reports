"use client"

import { useEffect, useState } from "react"
import { AlertCircle, BarChart3, Send, ShieldCheck } from "lucide-react"

const ERROR_MESSAGES: Record<string, string> = {
  not_registered: "This Telegram account isn't registered yet. Open the bot / mini app once, then try again.",
  oauth_not_configured: "Telegram login isn't configured on the server yet.",
  invalid_state: "Your login session expired. Please try again.",
  token_exchange_failed: "Couldn't complete Telegram sign-in. Please try again.",
  no_subject: "Telegram didn't return a usable account id.",
  server_error: "Something went wrong on our side. Please try again.",
  access_denied: "Sign-in was cancelled.",
}

export default function DashboardLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loginHref, setLoginHref] = useState("/api/dashboard/auth/login")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) setError(ERROR_MESSAGES[err] ?? "Sign-in failed. Please try again.")
    const next = params.get("next")
    if (next && next.startsWith("/dashboard")) {
      setLoginHref(`/api/dashboard/auth/login?next=${encodeURIComponent(next)}`)
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="fade-in-up glass-floating w-full max-w-md rounded-[calc(var(--radius)+12px)] p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Reports Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with Telegram to access reports, sheets and analytics for your role.
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <a
            href={loginHref}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[calc(var(--radius)+2px)] bg-[var(--telegram-blue)] px-5 text-sm font-semibold text-white shadow transition-transform hover:opacity-95 active:scale-[0.98]"
          >
            <Send className="h-4 w-4" />
            Log in with Telegram
          </a>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-left text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Access is limited to registered team members.
        </div>
      </div>
    </div>
  )
}
