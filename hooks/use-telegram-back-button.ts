"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * Telegram Mini App BackButton hook.
 *
 * Per official docs (https://core.telegram.org/bots/webapps#backbutton):
 *   - BackButton.onClick(cb) / BackButton.offClick(cb) to manage handlers
 *   - Telegram.WebApp.onEvent("backButtonClicked", cb) as alternative
 *   - BackButton.show() / BackButton.hide() for visibility
 *
 * Key design decisions:
 *   1. We use a SINGLE stable handler function (via useCallback with no deps)
 *      that reads from a ref. This means onClick/offClick always receive the
 *      exact same function reference, so cleanup always works.
 *   2. We register via BOTH onClick AND onEvent("backButtonClicked") to cover
 *      all Telegram client versions. The ref-based handler + active guard
 *      prevents double-fire.
 *   3. We poll for window.Telegram.WebApp if it's not available on first
 *      render (race condition with async SDK injection).
 */
export function useTelegramBackButton(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)
  const activeRef = useRef(true)

  // Keep callback ref fresh — assigned during render (safe: ref not read
  // during render, only inside event handler)
  onBackRef.current = onBack

  // Stable handler that never changes identity — critical for offClick to
  // match the same reference that onClick received.
  const stableHandler = useCallback(() => {
    if (!activeRef.current) return
    onBackRef.current()
  }, [])

  useEffect(() => {
    activeRef.current = true
    let cleanupFn: (() => void) | undefined

    const apply = (webApp: NonNullable<Window["Telegram"]>["WebApp"]) => {
      const btn = webApp.BackButton
      if (!btn) return

      if (enabled) {
        btn.show()
        // Register via onClick (primary, works everywhere)
        btn.onClick(stableHandler)
        // Also register via onEvent as fallback for some native clients
        if (typeof webApp.onEvent === "function") {
          webApp.onEvent("backButtonClicked", stableHandler)
        }
      } else {
        btn.hide()
      }

      cleanupFn = () => {
        activeRef.current = false
        if (enabled) {
          btn.offClick?.(stableHandler)
          if (typeof webApp.offEvent === "function") {
            webApp.offEvent("backButtonClicked", stableHandler)
          }
          btn.hide()
        }
      }
    }

    const webApp = window.Telegram?.WebApp
    if (webApp) {
      apply(webApp)
    } else {
      // Poll until Telegram SDK is injected
      let rafId: number
      const poll = () => {
        if (!activeRef.current) return
        const w = window.Telegram?.WebApp
        if (w) {
          apply(w)
        } else {
          rafId = requestAnimationFrame(poll)
        }
      }
      rafId = requestAnimationFrame(poll)

      cleanupFn = () => {
        activeRef.current = false
        cancelAnimationFrame(rafId)
      }
    }

    return () => {
      cleanupFn?.()
    }
  }, [enabled, stableHandler])
}
