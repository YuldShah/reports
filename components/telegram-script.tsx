"use client"

import { useEffect } from "react"

export default function TelegramScript() {
  useEffect(() => {
    // Load Telegram WebApp script
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-web-app.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return null
}
