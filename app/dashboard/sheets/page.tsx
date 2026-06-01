"use client"

import { useEffect, useState } from "react"
import { SheetTable } from "@/components/dashboard/sheet-table"
import { ExportButton } from "@/components/dashboard/export-button"
import { CenterSpinner, EmptyPanel, ErrorPanel } from "@/components/dashboard/states"
import { cn } from "@/lib/utils"
import type { SheetData, SheetDescriptor } from "@/lib/dashboard-data"

export default function SheetsPage() {
  const [sheets, setSheets] = useState<SheetDescriptor[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetData | null>(null)
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard/sheets")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setSheets(d.sheets ?? [])
        if (d.sheets?.[0]) setSelected(d.sheets[0].templateId)
      })
      .catch(() => {
        setSheets([])
        setError(true)
      })
  }, [])

  useEffect(() => {
    if (!selected) {
      setSheet(null)
      return
    }
    let active = true
    setLoadingSheet(true)
    fetch(`/api/dashboard/sheets/${selected}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setSheet(d))
      .catch(() => active && setSheet(null))
      .finally(() => active && setLoadingSheet(false))
    return () => {
      active = false
    }
  }, [selected])

  if (sheets === null) return <CenterSpinner />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Sheets</h1>
          <p className="text-sm text-muted-foreground">Each template as its own sheet — rows and column totals.</p>
        </div>
        {selected && <ExportButton params={{ templateId: selected }} />}
      </div>

      {error ? (
        <ErrorPanel />
      ) : sheets.length === 0 ? (
        <EmptyPanel message="No sheets available for your scope yet." />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {sheets.map((s) => (
              <button
                key={s.templateId}
                type="button"
                onClick={() => setSelected(s.templateId)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  selected === s.templateId
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {s.name || "Untitled"}
                <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {s.rowCount}
                </span>
              </button>
            ))}
          </div>

          {loadingSheet ? (
            <CenterSpinner />
          ) : sheet ? (
            <SheetTable sheet={sheet} />
          ) : (
            <EmptyPanel message="Select a sheet to view its rows." />
          )}
        </>
      )}
    </div>
  )
}
