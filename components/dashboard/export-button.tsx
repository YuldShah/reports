"use client"

import { useState } from "react"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportButtonProps {
  params: Record<string, string | number | undefined>
}

export function ExportButton({ params }: ExportButtonProps) {
  const [busy, setBusy] = useState<string | null>(null)

  async function download(format: "xlsx" | "csv") {
    setBusy(format)
    try {
      const qs = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) qs.set(key, String(value))
      })
      qs.set("format", format)
      const res = await fetch(`/api/dashboard/export?${qs.toString()}`)
      if (!res.ok) throw new Error("export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reports.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      /* swallow — surfaced via the spinner clearing */
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => download("xlsx")} disabled={busy !== null}>
        {busy === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => download("csv")} disabled={busy !== null}>
        {busy === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        CSV
      </Button>
    </div>
  )
}
