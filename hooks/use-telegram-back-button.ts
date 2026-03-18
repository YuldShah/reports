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

  // Always keep the ref current — no deps, runs after every render
  useEffect(() => {
    onBackRef.current = onBack
  })

  // Register handler ONCE on mount. Covers both:
  //   - Native iOS/Android: BackButton.onClick (called by native bridge)
  //   - Web Telegram: window.message with eventType "back_button_pressed"
  useEffect(() => {
    const webApp = getTelegramWebApp()
    if (!webApp || !supportsTelegramBackButton(webApp.version)) return

    const handleBack = () => onBackRef.current()

    // SDK path (native mobile Telegram)
    webApp.BackButton.onClick(handleBack)

    // Raw postMessage path (web version of Telegram)
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
        if (data?.eventType === "back_button_pressed") {
          handleBack()
        }
      } catch {
        // ignore parse errors from unrelated messages
      }
    }
    window.addEventListener("message", handleMessage)

    return () => {
      webApp.BackButton.offClick?.(handleBack)
      window.removeEventListener("message", handleMessage)
      webApp.BackButton.hide()
    }
  }, []) // intentionally empty — register/unregister once per mount

  // Separate effect: show/hide without cleanup so there's no hide→show race
  useEffect(() => {
    const webApp = getTelegramWebApp()
    if (!webApp || !supportsTelegramBackButton(webApp.version)) return

    if (enabled) {
      webApp.BackButton.show()
    } else {
      webApp.BackButton.hide()
    }
  }, [enabled])
}
