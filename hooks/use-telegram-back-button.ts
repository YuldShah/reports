"use client"

import { useEffect, useRef } from "react"

import { getTelegramWebApp } from "@/lib/telegram"

function supportsTelegramBackButton(version?: string) {
  if (!version) return false
  const [major = 0, minor = 0] = version.split(".").map((v) => parseInt(v, 10) || 0)
  return major > 6 || (major === 6 && minor >= 1)
}

export function useTelegramBackButton(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)

  // Always keep the ref current — no deps needed since it runs after every render
  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    const webApp = getTelegramWebApp()
    if (!webApp || !supportsTelegramBackButton(webApp.version)) return

    const handleBack = () => onBackRef.current()

    if (enabled) {
      webApp.BackButton.show()
      webApp.BackButton.onClick(handleBack)
    } else {
      webApp.BackButton.hide()
    }

    return () => {
      webApp.BackButton.offClick?.(handleBack)
      webApp.BackButton.hide()
    }
  }, [enabled])
}
