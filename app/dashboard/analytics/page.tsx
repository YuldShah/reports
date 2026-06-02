"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { CalendarClock, CheckCircle2, Clock, FileText, ImageIcon, PencilLine, TrendingUp, UserCheck, Users } from "lucide-react"
import { ActivityHeatmap, BarBreakdown, DistributionPie, HorizontalBars, TrendAreaChart } from "@/components/dashboard/charts"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { InfoHint } from "@/components/dashboard/info-hint"
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
  const span = data?.range.days ?? 30

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            Analytics
            <InfoHint title="How to read this page">
              Every number, chart and list below is calculated <strong>only</strong> from reports submitted within the
              date range on the right. Change the range (or use 7d / 30d / 90d) and everything recalculates. Coloured
              badges compare the current range to the <strong>previous period of equal length</strong> (e.g. a 30-day
              window is compared to the 30 days before it). Data is scoped to what you can see — admins get the whole
              org, team leads &amp; members get their team.
            </InfoHint>
          </h1>
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
            <KpiCard
              label="Submissions"
              value={data.kpis.total}
              icon={FileText}
              delta={data.kpis.totalDeltaPct}
              hint={`vs prev ${span}d`}
              info={
                <>
                  Total reports submitted in the selected range. The badge is the % change vs the previous {span} days
                  (previously {data.kpis.totalPrev}).
                </>
              }
            />
            <KpiCard
              label="Active People"
              value={data.kpis.activeSubmitters}
              icon={UserCheck}
              delta={pctDelta(data.kpis.activeSubmitters, data.kpis.activeSubmittersPrev)}
              hint={`prev ${data.kpis.activeSubmittersPrev}`}
              info={<>Number of distinct people who submitted at least one report in the range. The badge compares to the previous period.</>}
            />
            <KpiCard
              label="Avg / Day"
              value={data.kpis.avgPerDay}
              icon={TrendingUp}
              info={<>Average reports per day = total submissions ÷ {span} days in the range.</>}
            />
            <KpiCard
              label="Coverage"
              value={`${data.kpis.coverage.pct}%`}
              icon={Users}
              hint={`${data.kpis.coverage.submitted}/${data.kpis.coverage.members} submitted`}
              info={
                <>
                  Share of team members who submitted at least once in the range
                  ({data.kpis.coverage.submitted} of {data.kpis.coverage.members}). Low coverage means many members
                  aren&apos;t reporting — see &ldquo;Needs attention&rdquo; below.
                </>
              }
            />
            <KpiCard
              label="With Photos"
              value={`${data.kpis.withPhotosPct}%`}
              icon={ImageIcon}
              hint={`${data.kpis.withPhotos} reports`}
              info={<>Percentage of reports in the range that include at least one uploaded photo or file.</>}
            />
            <KpiCard
              label="Edited"
              value={`${data.kpis.editedPct}%`}
              icon={PencilLine}
              hint={`${data.kpis.edited} reports`}
              info={<>Percentage of reports changed after they were first submitted (last-updated time is later than the submitted time).</>}
            />
          </div>

          {/* quick facts */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="surface-panel flex items-center gap-3 rounded-[calc(var(--radius)+4px)] border p-4">
              <CalendarClock className="h-5 w-5 text-primary" />
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Busiest day: </span>
                <span className="font-semibold">
                  {data.kpis.busiestDay ? `${data.kpis.busiestDay.date} (${data.kpis.busiestDay.count})` : "—"}
                </span>
                <InfoHint title="Busiest day">The single calendar day in the range with the most reports submitted.</InfoHint>
              </div>
            </div>
            <div className="surface-panel flex items-center gap-3 rounded-[calc(var(--radius)+4px)] border p-4">
              <Clock className="h-5 w-5 text-primary" />
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Peak hour: </span>
                <span className="font-semibold">
                  {data.kpis.peakHour ? `${String(data.kpis.peakHour.hour).padStart(2, "0")}:00 (${data.kpis.peakHour.count})` : "—"}
                </span>
                <InfoHint title="Peak hour">The hour of day (local Tashkent time) when the most reports are submitted, across the whole range.</InfoHint>
              </div>
            </div>
          </div>

          <ChartCard
            title="Submissions over time"
            info={<>Reports submitted per calendar day across the range. Use it to spot spikes, dips and overall momentum.</>}
          >
            <TrendAreaChart data={data.trend} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="By day of week"
              info={<>Reports grouped by weekday (local time). Reveals which weekdays people report on — e.g. Monday-heavy, quiet weekends.</>}
            >
              <BarBreakdown data={data.dow} height={240} />
            </ChartCard>
            <ChartCard
              title="By hour of day"
              info={<>Reports grouped by the hour they were submitted (local time, 00–23). Shows when during the day reports come in.</>}
            >
              <BarBreakdown data={data.hours} height={240} />
            </ChartCard>
          </div>

          <ChartCard
            title="When reports come in"
            info={
              <>
                Each cell is a weekday × hour-of-day combination (local time). Darker cells = more reports submitted in
                that slot. It pinpoints the exact windows when reporting actually happens.
              </>
            }
          >
            <ActivityHeatmap data={data.heatmap} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="By template" info={<>Share of reports by the form/template used. Shows which report types are most common.</>}>
              {data.perTemplate.length ? (
                <DistributionPie data={data.perTemplate.map((t) => ({ name: t.name, count: t.count }))} />
              ) : (
                <EmptyPanel message="No data in range." />
              )}
            </ChartCard>
            {data.perTeam.length > 1 ? (
              <ChartCard title="By team" info={<>Number of reports submitted per team in the range.</>}>
                <BarBreakdown data={data.perTeam.map((t) => ({ name: t.name, count: t.count }))} />
              </ChartCard>
            ) : (
              <ChartCard title="Top contributors" info={<>The people who submitted the most reports in the range (top 12).</>}>
                {data.leaderboard.length ? (
                  <HorizontalBars data={data.leaderboard.map((u) => ({ name: u.name, count: u.count }))} />
                ) : (
                  <EmptyPanel message="No data in range." />
                )}
              </ChartCard>
            )}
          </div>

          {data.perTeam.length > 1 && (
            <ChartCard title="Top contributors" info={<>The people who submitted the most reports in the range (top 12).</>}>
              {data.leaderboard.length ? (
                <HorizontalBars data={data.leaderboard.map((u) => ({ name: u.name, count: u.count }))} />
              ) : (
                <EmptyPanel message="No data in range." />
              )}
            </ChartCard>
          )}

          {/* Needs attention */}
          <Card className="surface-panel">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 font-heading text-base">
                Needs attention
                <span className="text-xs font-normal text-muted-foreground">
                  {data.inactiveMembers.length} of {data.kpis.coverage.members} members didn&apos;t submit
                </span>
                <InfoHint title="Needs attention">
                  Team members who did <strong>not</strong> submit any report in the selected range. Use it to follow up
                  with people who are behind on reporting. (Admins see everyone; leads/members see their team.)
                </InfoHint>
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

          {/* Numeric insights */}
          {data.numericInsights.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
                Reported totals
                <InfoHint title="Reported totals">
                  The actual numbers people typed into their reports. For every numeric field in each form, this sums
                  the values across all reports in the range and shows the average per report that filled it in. It
                  surfaces the real data (students reached, counts, etc.) — not just how many reports were filed.
                </InfoHint>
              </h2>
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

function ChartCard({ title, info, children }: { title: string; info?: ReactNode; children: ReactNode }) {
  return (
    <Card className="surface-panel">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 font-heading text-base">
          {title}
          {info && <InfoHint title={title}>{info}</InfoHint>}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
