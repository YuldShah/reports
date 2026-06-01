"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, CalendarDays, FileText, FolderKanban, Table2, TrendingUp, Users } from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { TrendAreaChart } from "@/components/dashboard/charts"
import { CenterSpinner, ErrorPanel } from "@/components/dashboard/states"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SummaryKpis } from "@/lib/dashboard-data"

export default function OverviewPage() {
  const [data, setData] = useState<SummaryKpis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Reporting activity across your scope.</p>
      </div>

      {loading ? (
        <CenterSpinner />
      ) : !data ? (
        <ErrorPanel />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 stagger-children md:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Total Reports" value={data.totalReports} icon={FileText} />
            <KpiCard label="Today" value={data.reportsToday} icon={CalendarDays} />
            <KpiCard label="Last 7 days" value={data.reports7d} icon={TrendingUp} />
            <KpiCard label="Last 30 days" value={data.reports30d} icon={TrendingUp} />
            <KpiCard label="Active People" value={data.activeSubmitters} icon={Users} />
            <KpiCard label="Templates" value={data.templates} icon={FolderKanban} />
          </div>

          <Card className="surface-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Submissions — last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendAreaChart data={data.trend} />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <QuickLink href="/dashboard/reports" icon={FileText} title="Browse reports" desc="Everyone's submissions, with photos" />
            <QuickLink href="/dashboard/sheets" icon={Table2} title="Sheets" desc="Per-template rows & totals" />
            <QuickLink href="/dashboard/analytics" icon={BarChart3} title="Analytics" desc="Trends, breakdowns, leaderboards" />
          </div>
        </>
      )}
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string
  icon: typeof FileText
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="surface-panel card-interactive group flex items-center gap-3 rounded-[calc(var(--radius)+4px)] border p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
