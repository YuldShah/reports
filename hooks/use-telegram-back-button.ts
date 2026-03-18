"use client"

import { useEffect, useRef } from "react"

export function useTelegramBackButton(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)

  // Keep ref current on every render
  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    const btn = window.Telegram?.WebApp?.BackButton
    if (!btn) return

    const handler = () => onBackRef.current()

    if (enabled) {
      btn.show()
      btn.onClick(handler)
    } else {
      btn.hide()
    }

    return () => {
      btn.offClick?.(handler)
      btn.hide()
    }
  }, [enabled])
}
