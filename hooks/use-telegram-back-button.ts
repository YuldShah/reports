"use client"

import { useEffect, useRef } from "react"

export function useTelegramBackButton(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    const btn = webApp?.BackButton
    if (!btn) return

    // Guard against double-fire from redundant listener paths
    let fired = false
    const handler = () => {
      if (fired) return
      fired = true
      setTimeout(() => { fired = false }, 100)
      onBackRef.current()
    }

    if (enabled) {
      btn.show()
      btn.onClick(handler)
      // Redundant path via generic event system
      webApp.onEvent?.("backButtonClicked", handler)
    } else {
      btn.hide()
    }

    return () => {
      btn.offClick?.(handler)
      webApp.offEvent?.("backButtonClicked", handler)
      btn.hide()
    }
  }, [enabled])
}
