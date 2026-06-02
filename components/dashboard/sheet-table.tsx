"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PhotoLightbox } from "@/components/dashboard/photo-lightbox"
import type { SheetData } from "@/lib/dashboard-data"

const PHOTO_TYPES = new Set(["file", "photo", "image"])

function fmtCell(value: unknown): string {
  if (value == null || value === "") return "—"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) return value.replace("T", " ").slice(0, 16)
  return String(value)
}

export function SheetTable({ sheet }: { sheet: SheetData }) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)
  const hasTotals = Object.keys(sheet.totals).length > 0

  if (sheet.rows.length === 0) {
    return (
      <div className="surface-panel rounded-[calc(var(--radius)+4px)] border p-10 text-center text-sm text-muted-foreground">
        No rows in this sheet yet.
      </div>
    )
  }

  return (
    <>
      <div className="surface-panel overflow-hidden rounded-[calc(var(--radius)+4px)] border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {sheet.columns.map((col) => (
                <TableHead key={col.key} className={col.numeric ? "text-right" : ""}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheet.rows.map((row, idx) => (
              <TableRow key={idx} className="h-11">
                {sheet.columns.map((col) => {
                  const value = row[col.key]
                  if (PHOTO_TYPES.has(col.type)) {
                    const urls = Array.isArray(value) ? (value as string[]) : []
                    return (
                      <TableCell key={col.key} className="whitespace-nowrap">
                        {urls.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setLightbox({ urls, index: 0 })}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            View {urls.length}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )
                  }
                  const text = fmtCell(value)
                  return (
                    <TableCell key={col.key} className={col.numeric ? "whitespace-nowrap text-right tabular-nums" : ""}>
                      <span className="block max-w-[240px] truncate" title={text}>
                        {text}
                      </span>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
          {hasTotals && (
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                {sheet.columns.map((col, i) => (
                  <TableCell key={col.key} className={col.numeric ? "text-right tabular-nums font-semibold" : "font-semibold"}>
                    {i === 0 ? "TOTAL" : col.numeric && sheet.totals[col.key] != null ? sheet.totals[col.key] : ""}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
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
