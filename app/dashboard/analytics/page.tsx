"use client"

import { useEffect, useState } from "react"
import { BarBreakdown, DistributionPie, HorizontalBars, TrendAreaChart } from "@/components/dashboard/charts"
import { CenterSpinner, EmptyPanel, ErrorPanel } from "@/components/dashboard/states"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AnalyticsPayload } from "@/lib/dashboard-data"

function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const fieldClass = "surface-field h-9 rounded-[calc(var(--radius)+2px)] border px-3 text-sm text-foreground"

export default function AnalyticsPage() {
  const [from, setFrom] = useState(daysAgoISO(30))
  const [to, setTo] = useState(todayISO())
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    const qs = new URLSearchParams({ from, to: `${to}T23:59:59.999` })
    fetch(`/api/dashboard/analytics?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setData(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [from, to])

  const setRange = (n: number) => {
    setFrom(daysAgoISO(n))
    setTo(todayISO())
  }

  const activeRange = (n: number) => from === daysAgoISO(n) && to === todayISO()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Trends and breakdowns across your scope.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((n) => (
            <Button key={n} variant={activeRange(n) ? "default" : "outline"} size="sm" onClick={() => setRange(n)}>
              {n}d
            </Button>
          ))}
          <input type="date" className={fieldClass} value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
          <input type="date" className={fieldClass} value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        </div>
      </div>

      {loading && !data ? (
        <CenterSpinner />
      ) : error || !data ? (
        <ErrorPanel />
      ) : (
        <div className={cn("space-y-4", loading && "opacity-60 transition-opacity")}>
          <Card className="surface-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Submissions over time</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendAreaChart data={data.trend} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="By template">
              {data.perTemplate.length ? (
                <DistributionPie data={data.perTemplate.map((t) => ({ name: t.name, count: t.count }))} />
              ) : (
                <EmptyPanel message="No data in range." />
              )}
            </ChartCard>

            <ChartCard title="By team">
              {data.perTeam.length ? (
                <BarBreakdown data={data.perTeam.map((t) => ({ name: t.name, count: t.count }))} />
              ) : (
                <EmptyPanel message="No data in range." />
              )}
            </ChartCard>

            <ChartCard title="Top contributors">
              {data.leaderboard.length ? (
                <HorizontalBars data={data.leaderboard.map((u) => ({ name: u.name, count: u.count }))} />
              ) : (
                <EmptyPanel message="No data in range." />
              )}
            </ChartCard>

            {data.studentTracker.length > 0 && (
              <ChartCard title="Student tracker totals">
                <BarBreakdown data={data.studentTracker.map((c) => ({ name: c.course, count: c.total }))} />
              </ChartCard>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="surface-panel">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
