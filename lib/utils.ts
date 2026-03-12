import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const mojibakeFragments: Array<[RegExp, string]> = [
  [/â¬Ã¡/g, ""],
  [/â©â/g, "'"],
  [/ÎÃÃ¿/g, "'"],
  [/â€™|â€˜|â€²/g, "'"],
  [/â€œ|â€/g, '"'],
  [/â€“|â€”/g, "-"],
  [/â€¦/g, "..."],
  [/Â/g, ""],
]

const mojibakePattern = /[ÃâÎÂ]/

function decodeLatin1AsUtf8(value: string) {
  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => {
      const codePoint = character.codePointAt(0) ?? 63
      return codePoint <= 255 ? codePoint : 63
    })

    return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
  } catch {
    return value
  }
}

function scoreDisplayText(value: string) {
  const mojibakeCount = value.match(/[ÃâÎÂ]/g)?.length ?? 0
  const replacementCount = value.match(/[\uFFFD]/g)?.length ?? 0
  return mojibakeCount * 4 + replacementCount * 8
}

export function normalizeText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return ""
  }

  const trimmed = value.replace(/\u00a0/g, " ").trim()
  if (!trimmed) {
    return ""
  }

  const candidates = [trimmed]
  if (mojibakePattern.test(trimmed)) {
    candidates.push(decodeLatin1AsUtf8(trimmed))
    candidates.push(decodeLatin1AsUtf8(decodeLatin1AsUtf8(trimmed)))
  }

  const bestCandidate = candidates.reduce((best, candidate) => {
    const normalizedCandidate = mojibakeFragments.reduce(
      (result, [pattern, replacement]) => result.replace(pattern, replacement),
      candidate,
    )

    return scoreDisplayText(normalizedCandidate) < scoreDisplayText(best)
      ? normalizedCandidate
      : best
  }, trimmed)

  return bestCandidate
    .replace(/^[\-•\s]+(?=[A-Za-z])/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}
