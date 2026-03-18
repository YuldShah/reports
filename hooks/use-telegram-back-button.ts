"use client"

import { useEffect, useRef, useState } from "react"

import { getTelegramWebApp } from "@/lib/telegram"

function supportsTelegramBackButton(version?: string) {
  if (!version) return false

  const [major = 0, minor = 0] = version.split(".").map((value) => Number.parseInt(value, 10) || 0)
  return major > 6 || (major === 6 && minor >= 1)
}

export function useTelegramBackButton(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false)

  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let intervalId: number | undefined
    let cancelled = false

    const attach = () => {
      const webApp = getTelegramWebApp()
      if (!webApp) {
        setIsTelegramWebApp(false)
        return false
      }

      if (!supportsTelegramBackButton(webApp.version)) {
        setIsTelegramWebApp(false)
        return false
      }

      setIsTelegramWebApp(true)

      const handleBack = () => onBackRef.current()

      if (enabled) {
        webApp.BackButton.show()
        if (typeof webApp.onEvent === "function" && typeof webApp.offEvent === "function") {
          webApp.onEvent("backButtonClicked", handleBack)
          cleanup = () => {
            webApp.offEvent?.("backButtonClicked", handleBack)
            webApp.BackButton.hide()
          }
        } else {
          webApp.BackButton.onClick(handleBack)
          cleanup = () => {
            webApp.BackButton.hide()
          }
        }
      } else {
        webApp.BackButton.hide()
        cleanup = () => {
          webApp.BackButton.hide()
        }
      }

      return true
    }

    if (!attach()) {
      let attempts = 0
      intervalId = window.setInterval(() => {
        if (cancelled) return
        attempts += 1
        if (attach() || attempts >= 20) {
          window.clearInterval(intervalId)
        }
      }, 100)
    }

    return () => {
      cancelled = true
      if (intervalId) {
        window.clearInterval(intervalId)
      }
      cleanup?.()
    }
  }, [enabled])

  return isTelegramWebApp
}
