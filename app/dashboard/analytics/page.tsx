"use client"

import { useEffect, useState } from "react"
import { CalendarClock, CheckCircle2, Clock, FileText, ImageIcon, PencilLine, TrendingUp, UserCheck, Users } from "lucide-react"
import { ActivityHeatmap, BarBreakdown, DistributionPie, HorizontalBars, TrendAreaChart } from "@/components/dashboard/charts"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { CenterSpinner, EmptyPanel, ErrorPanel } from "@/components/dashboard/states"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import type { AnalyticsPayload } from "@/lib/dashboard-data"

function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function pctDelta(cur: number, prev: number): number | null {
  return prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null
}

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
          <p className="text-sm text-muted-foreground">Deep insights across your scope.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((n) => (
            <Button key={n} variant={activeRange(n) ? "default" : "outline"} size="sm" onClick={() => setRange(n)}>
              {n}d
            </Button>
          ))}
          <div className="w-36">
            <DatePicker value={from} onChange={(v) => v && setFrom(v)} placeholder="From" />
          </div>
          <div className="w-36">
            <DatePicker value={to} onChange={(v) => v && setTo(v)} placeholder="To" />
          </div>
        </div>
      </div>

      {loading && !data ? (
        <CenterSpinner />
      ) : error || !data ? (
        <ErrorPanel />
      ) : (
        <div className={cn("space-y-4", loading && "opacity-60 transition-opacity")}>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 stagger-children md:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Submissions" value={data.kpis.total} icon={FileText} delta={data.kpis.totalDeltaPct} hint={`vs prev ${data.range.days}d`} />
            <KpiCard
              label="Active People"
              value={data.kpis.activeSubmitters}
              icon={UserCheck}
              delta={pctDelta(data.kpis.activeSubmitters, data.kpis.activeSubmittersPrev)}
              hint={`prev ${data.kpis.activeSubmittersPrev}`}
            />
            <KpiCard label="Avg / Day" value={data.kpis.avgPerDay} icon={TrendingUp} />
            <KpiCard label="Coverage" value={`${data.kpis.coverage.pct}%`} icon={Users} hint={`${data.kpis.coverage.submitted}/${data.kpis.coverage.members} submitted`} />
            <KpiCard label="With Photos" value={`${data.kpis.withPhotosPct}%`} icon={ImageIcon} hint={`${data.kpis.withPhotos} reports`} />
            <KpiCard label="Edited" value={`${data.kpis.editedPct}%`} icon={PencilLine} hint={`${data.kpis.edited} reports`} />
          </div>

          {/* quick facts */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="surface-panel flex items-center gap-3 rounded-[calc(var(--radius)+4px)] border p-4">
              <CalendarClock className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <span className="text-muted-foreground">Busiest day: </span>
                <span className="font-semibold">
                  {data.kpis.busiestDay ? `${data.kpis.busiestDay.date} (${data.kpis.busiestDay.count})` : "—"}
                </span>
              </div>
            </div>
            <div className="surface-panel flex items-center gap-3 rounded-[calc(var(--radius)+4px)] border p-4">
              <Clock className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <span className="text-muted-foreground">Peak hour: </span>
                <span className="font-semibold">
                  {data.kpis.peakHour ? `${String(data.kpis.peakHour.hour).padStart(2, "0")}:00 (${data.kpis.peakHour.count})` : "—"}
                </span>
              </div>
            </div>
          </div>

          <ChartCard title="Submissions over time">
            <TrendAreaChart data={data.trend} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="By day of week">
              <BarBreakdown data={data.dow} height={240} />
            </ChartCard>
            <ChartCard title="By hour of day">
              <BarBreakdown data={data.hours} height={240} />
            </ChartCard>
          </div>

          <ChartCard title="When reports come in (local time)">
            <ActivityHeatmap data={data.heatmap} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="By template">
              {data.perTemplate.length ? (
                <DistributionPie data={data.perTemplate.map((t) => ({ name: t.name, count: t.count }))} />
              ) : (
                <EmptyPanel message="No data in range." />
              )}
            </ChartCard>
            {data.perTeam.length > 1 ? (
              <ChartCard title="By team">
                <BarBreakdown data={data.perTeam.map((t) => ({ name: t.name, count: t.count }))} />
              </ChartCard>
            ) : (
              <ChartCard title="Top contributors">
                {data.leaderboard.length ? (
                  <HorizontalBars data={data.leaderboard.map((u) => ({ name: u.name, count: u.count }))} />
                ) : (
                  <EmptyPanel message="No data in range." />
                )}
              </ChartCard>
            )}
          </div>

          {data.perTeam.length > 1 && (
            <ChartCard title="Top contributors">
              {data.leaderboard.length ? (
                <HorizontalBars data={data.leaderboard.map((u) => ({ name: u.name, count: u.count }))} />
              ) : (
                <EmptyPanel message="No data in range." />
              )}
            </ChartCard>
          )}

          {/* Needs attention: members who didn't submit */}
          <Card className="surface-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">
                Needs attention
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {data.inactiveMembers.length} of {data.kpis.coverage.members} members didn&apos;t submit
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.inactiveMembers.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> Everyone in scope submitted at least once. 🎉
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.inactiveMembers.slice(0, 40).map((m) => (
                    <span
                      key={m.telegramId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs"
                    >
                      {m.name}
                      {m.team && <span className="text-muted-foreground">· {m.team}</span>}
                    </span>
                  ))}
                  {data.inactiveMembers.length > 40 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">+{data.inactiveMembers.length - 40} more</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Numeric insights — the hidden data inside answers */}
          {data.numericInsights.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-bold tracking-tight">Reported totals</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.numericInsights.map((tpl) => (
                  <Card key={tpl.templateId} className="surface-panel">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-heading text-base">
                        {tpl.templateName}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">{tpl.reports} reports</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {tpl.fields.map((f) => (
                          <div key={f.label} className="rounded-[calc(var(--radius)+2px)] border border-border/70 bg-background/60 p-3">
                            <div className="truncate text-xs text-muted-foreground" title={f.label}>
                              {f.label}
                            </div>
                            <div className="mt-1 font-heading text-xl font-bold tracking-tight tabular-nums">
                              {f.sum.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-muted-foreground">avg {f.avg.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
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
