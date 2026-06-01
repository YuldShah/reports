"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
  const [expanded, setExpanded] = useState<string | null>(null)
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
              <TableHead className="w-8" />
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
              const isOpen = expanded === row.id
              const photos = rowPhotos(row)
              return (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                  >
                    <TableCell className="text-muted-foreground">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{fmt(row.createdAt)}</TableCell>
                    <TableCell className="font-medium">{row.user.name}</TableCell>
                    <TableCell>{row.team.name || "—"}</TableCell>
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
                  {isOpen && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="bg-background/40">
                        <div className="grid gap-3 p-2 sm:grid-cols-2 lg:grid-cols-3">
                          {row.cells.length === 0 && (
                            <span className="text-sm text-muted-foreground">No fields recorded.</span>
                          )}
                          {row.cells.map((cell) => (
                            <div
                              key={cell.fieldId}
                              className="rounded-xl border border-border/60 bg-card/60 p-3"
                            >
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {cell.label}
                              </div>
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
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <PhotoLightbox
        urls={lightbox?.urls ?? []}
        open={lightbox !== null}
        startIndex={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
      />
    </>
  )
}
