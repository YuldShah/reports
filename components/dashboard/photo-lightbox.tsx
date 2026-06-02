"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Download, FileText, X } from "lucide-react"

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/i

function isImage(url: string): boolean {
  return IMAGE_EXT.test(url.split("?")[0])
}

function fileName(url: string): string {
  try {
    const path = decodeURIComponent(new URL(url, "http://x").pathname)
    return path.split("/").pop() || url
  } catch {
    return url
  }
}

interface PhotoLightboxProps {
  urls: string[]
  open: boolean
  startIndex?: number
  onClose: () => void
}

export function PhotoLightbox({ urls, open, startIndex = 0, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    if (open) setIndex(startIndex)
  }, [open, startIndex])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") setIndex((p) => Math.min(p + 1, urls.length - 1))
      if (e.key === "ArrowLeft") setIndex((p) => Math.max(p - 1, 0))
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, urls.length, onClose])

  if (!open || urls.length === 0) return null
  const url = urls[Math.min(index, urls.length - 1)]
  const multi = urls.length > 1

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {multi && index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((p) => Math.max(p - 1, 0))
          }}
          className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <div className="relative flex max-h-[88vh] max-w-4xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {isImage(url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={fileName(url)} className="max-h-[80vh] rounded-xl object-contain shadow-2xl" />
        ) : (
          <div className="glass-floating flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
            <FileText className="h-12 w-12 text-primary" />
            <p className="max-w-xs break-all text-sm text-foreground">{fileName(url)}</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open file
            </a>
          </div>
        )}
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-white/80">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            <Download className="h-4 w-4" /> Download
          </a>
          {multi && (
            <span className="tabular-nums">
              {index + 1} / {urls.length}
            </span>
          )}
        </div>
      </div>

      {multi && index < urls.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIndex((p) => Math.min(p + 1, urls.length - 1))
          }}
          className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
