"use client"

import { useEffect, useState } from "react"
import { CalendarClock, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { FiltersBar, type ReportFiltersState } from "@/components/dashboard/filters-bar"
import { ReportsTable } from "@/components/dashboard/reports-table"
import { ExportButton } from "@/components/dashboard/export-button"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { CenterSpinner, ErrorPanel } from "@/components/dashboard/states"
import { useDashboardSession } from "@/components/dashboard/session-provider"
import { Button } from "@/components/ui/button"
import { filtersToParams } from "@/lib/dashboard-filters"
import type { ReportsResult } from "@/lib/dashboard-data"

export default function MyRecordsPage() {
  const { me, loading: sessionLoading } = useDashboardSession()
  const [filters, setFilters] = useState<ReportFiltersState>({})
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ReportsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    if (!me) return
    let active = true
    setLoading(true)
    setError(false)
    const params = filtersToParams({ ...filters, userId: me.telegramId })
    const qs = new URLSearchParams(params)
    qs.set("page", String(page))
    qs.set("pageSize", "25")
    fetch(`/api/dashboard/reports?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setData(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [me, filters, page])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">My Records</h1>
          <p className="text-sm text-muted-foreground">Reports you have submitted.</p>
        </div>
        {me && <ExportButton params={filtersToParams({ ...filters, userId: me.telegramId })} />}
      </div>

      {sessionLoading || (loading && !data) ? (
        <CenterSpinner />
      ) : error || !data ? (
        <ErrorPanel />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <KpiCard label="My Reports" value={data.total} icon={FileText} />
            <KpiCard label="Showing" value={`${data.rows.length}`} icon={CalendarClock} hint={`Page ${data.page} of ${totalPages}`} />
          </div>

          <FiltersBar value={filters} onChange={setFilters} showTeam={false} showUser={false} />

          <ReportsTable rows={data.rows} />

          <div className="flex items-center justify-end gap-3 px-1 text-sm">
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
        </>
      )}
    </div>
  )
}
