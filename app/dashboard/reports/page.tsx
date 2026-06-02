"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FiltersBar, type ReportFiltersState } from "@/components/dashboard/filters-bar"
import { ReportsTable } from "@/components/dashboard/reports-table"
import { ExportButton } from "@/components/dashboard/export-button"
import { DashSelect } from "@/components/dashboard/select"
import { CenterSpinner, ErrorPanel } from "@/components/dashboard/states"
import { Button } from "@/components/ui/button"
import { filtersToParams } from "@/lib/dashboard-filters"
import type { ReportsResult } from "@/lib/dashboard-data"

const PAGE_SIZES = [10, 25, 50, 100]

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersState>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [data, setData] = useState<ReportsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [filters, pageSize])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    const params = filtersToParams(filters)
    const qs = new URLSearchParams(params)
    qs.set("page", String(page))
    qs.set("pageSize", String(pageSize))
    fetch(`/api/dashboard/reports?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setData(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [filters, page, pageSize])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} report${data.total === 1 ? "" : "s"}` : "Everyone's submissions"}
          </p>
        </div>
        <ExportButton params={filtersToParams(filters)} />
      </div>

      <FiltersBar value={filters} onChange={setFilters} />

      {loading ? (
        <CenterSpinner />
      ) : error || !data ? (
        <ErrorPanel />
      ) : (
        <>
          <ReportsTable rows={data.rows} />

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <DashSelect
                ariaLabel="Rows per page"
                className="h-8 w-20"
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
                options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
              />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="tabular-nums text-muted-foreground">
                Page {data.page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
