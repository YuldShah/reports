"use client"

import { useState } from "react"
import { CalendarClock, ImageIcon, Users2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PhotoLightbox } from "@/components/dashboard/photo-lightbox"
import { cn } from "@/lib/utils"
import type { EnrichedReportRow, ReportCell } from "@/lib/dashboard-data"

function fmt(iso: string): string {
  return iso.replace("T", " ").slice(0, 16)
}

function displayValue(cell: ReportCell): string {
  const v = cell.value
  if (v == null || v === "") return "—"
  if (Array.isArray(v)) return v.join(", ")
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function rowPhotos(row: EnrichedReportRow): string[] {
  return row.cells.flatMap((c) => c.photoUrls ?? [])
}

export function ReportsTable({ rows }: { rows: EnrichedReportRow[] }) {
  const [selected, setSelected] = useState<EnrichedReportRow | null>(null)
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)

  if (rows.length === 0) {
    return (
      <div className="surface-panel rounded-[calc(var(--radius)+4px)] border p-10 text-center text-sm text-muted-foreground">
        No reports match the current filters.
      </div>
    )
  }

  return (
    <>
      <div className="surface-panel overflow-hidden rounded-[calc(var(--radius)+4px)] border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Submitted</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Media</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const photos = rowPhotos(row)
              return (
                <TableRow key={row.id} className="h-12 cursor-pointer" onClick={() => setSelected(row)}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{fmt(row.createdAt)}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{row.user.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.team.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {row.template.name || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">{row.title || "—"}</TableCell>
                  <TableCell className="text-right">
                    {photos.length > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightbox({ urls: photos, index: 0 })
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        {photos.length}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{selected?.title || "Report"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" /> {fmt(selected.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users2 className="h-3.5 w-3.5" /> {selected.user.name}
                </span>
                {selected.team.name && <Badge variant="outline">{selected.team.name}</Badge>}
                {selected.template.name && <Badge variant="secondary">{selected.template.name}</Badge>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selected.cells.length === 0 && (
                  <span className="text-sm text-muted-foreground">No fields recorded.</span>
                )}
                {selected.cells.map((cell) => (
                  <div key={cell.fieldId} className="rounded-xl border border-border/60 bg-card/60 p-3 text-left">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{cell.label}</div>
                    {cell.photoUrls && cell.photoUrls.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setLightbox({ urls: cell.photoUrls!, index: 0 })}
                        className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        View {cell.photoUrls.length} {cell.photoUrls.length === 1 ? "file" : "files"}
                      </button>
                    ) : (
                      <div className={cn("mt-1 break-words text-sm", displayValue(cell) === "—" && "text-muted-foreground")}>
                        {displayValue(cell)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PhotoLightbox
        urls={lightbox?.urls ?? []}
        open={lightbox !== null}
        startIndex={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
      />
    </>
  )
}
