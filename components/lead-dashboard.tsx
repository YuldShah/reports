"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  Eye,
  FileText,
  LayoutDashboard,
  RefreshCw,
  TableProperties,
} from "lucide-react"

import BottomNav from "@/components/bottom-nav"
import ReportDetails from "@/components/report-details"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button"
import type { User } from "@/lib/types"
import { normalizeText } from "@/lib/utils"

interface LeadDashboardProps {
  user: User
}

interface SheetStat {
  title: string
  sheetId: number
  rowCount: number
  headers: string[]
  columnTotals: Record<string, number>
}

export default function LeadDashboard({ user }: LeadDashboardProps) {
  const [activeSection, setActiveSection] = useState("overview")
  const [reports, setReports] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [sheetStats, setSheetStats] = useState<SheetStat[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  useTelegramBackButton(!!selectedReportId, () => setSelectedReportId(null))

  const switchSection = (id: string) => {
    setActiveSection(id)
    setTimeout(() => window.scrollTo({ top: 0 }), 210)
  }

  useEffect(() => {
    if (selectedReportId) window.scrollTo({ top: 0 })
  }, [selectedReportId])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const teamId = user.teamId
      const url = teamId ? `/api/reports?teamId=${teamId}` : `/api/reports`
      const [reportsRes, teamsRes] = await Promise.all([
        fetch(url),
        fetch("/api/teams"),
      ])
      const reportsData = await reportsRes.json()
      const teamsData = await teamsRes.json()
      setReports(
        (reportsData.reports || []).map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }))
      )
      setTeams(
        (teamsData.teams || []).map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }))
      )
    } catch (err) {
      console.error("Error fetching reports:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSheetStats = async () => {
    try {
      setStatsLoading(true)
      const res = await fetch("/api/sheets/stats")
      if (res.ok) {
        const data = await res.json()
        setSheetStats(data.stats || [])
      }
    } catch (err) {
      console.error("Error fetching sheet stats:", err)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    fetchSheetStats()
  }, [user.teamId])

  const paginatedReports = reports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE)

  if (selectedReportId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-4xl pb-12"
      >
        <ReportDetails
          reportId={selectedReportId}
          onBack={() => setSelectedReportId(null)}
          canEdit={false}
          currentUserId={user.telegramId}
        />
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl pb-32">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="space-y-6"
        >
          {/* ── OVERVIEW ── */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <Card className="surface-panel overflow-hidden border-primary/20 bg-gradient-to-br from-primary/12 via-card/92 to-card/70">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-2">
                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                      Reports Overview
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Monitor submitted reports and aggregated stats from Google Sheets.
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total Reports</span>
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="font-heading text-3xl font-bold tracking-tight">
                        {loading ? "…" : reports.length}
                      </div>
                    </div>

                    <div className="rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Sheets</span>
                        <TableProperties className="h-4 w-4 text-chart-2" />
                      </div>
                      <div className="font-heading text-3xl font-bold tracking-tight">
                        {statsLoading ? "…" : sheetStats.length}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Sheet Rows</span>
                        <BarChart3 className="h-4 w-4 text-success" />
                      </div>
                      <div className="font-heading text-3xl font-bold tracking-tight">
                        {statsLoading ? "…" : sheetStats.reduce((acc, s) => acc + s.rowCount, 0)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sheets stats per sheet */}
              {statsLoading ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
              ) : sheetStats.length > 0 ? (
                <div className="space-y-4">
                  {sheetStats.map((sheet) => {
                    const totals = Object.entries(sheet.columnTotals)
                    return (
                      <Card key={sheet.sheetId} className="surface-panel border-glass-border/80">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 font-heading text-base">
                            <TableProperties className="h-4 w-4 text-primary" />
                            {sheet.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {sheet.rowCount} {sheet.rowCount === 1 ? "row" : "rows"}
                          </CardDescription>
                        </CardHeader>
                        {totals.length > 0 && (
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                              {totals.map(([col, total]) => (
                                <div
                                  key={col}
                                  className="rounded-[calc(var(--radius)+2px)] border border-border/70 bg-background/60 p-3"
                                >
                                  <div className="truncate text-xs text-muted-foreground">{col}</div>
                                  <div className="mt-1 font-heading text-xl font-bold tracking-tight">
                                    {total.toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card className="surface-panel border-glass-border/80">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    No sheet data available yet.
                  </CardContent>
                </Card>
              )}

              {/* Recent reports */}
              <Card className="surface-panel border-glass-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-base">Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="flex h-16 items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                      </div>
                    ) : reports.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No reports yet.</p>
                    ) : (
                      reports.slice(0, 5).map((report) => {
                        const team = teams.find((t) => t.id === report.teamId)
                        return (
                          <div
                            key={report.id}
                            className="flex items-center justify-between gap-3 rounded-[calc(var(--radius)+2px)] border border-border/80 bg-background/65 p-3 card-interactive"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{normalizeText(report.title)}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {normalizeText(team?.name || "Unknown")} · {report.createdAt.toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedReportId(report.id)}
                              className="h-9 w-9 shrink-0 p-0 hover:bg-primary/10 hover:text-primary"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeSection === "reports" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold">Reports</h2>
                  <p className="text-sm text-muted-foreground">
                    {reports.length} total · read-only
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={fetchReports} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
              ) : reports.length === 0 ? (
                <Card className="surface-panel">
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    No reports found.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedReports.map((report) => {
                      const team = teams.find((t) => t.id === report.teamId)
                      return (
                        <div
                          key={report.id}
                          className="flex items-center justify-between gap-3 rounded-[calc(var(--radius)+4px)] border border-border/80 bg-background/65 p-4 card-interactive"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 truncate text-sm font-medium">{normalizeText(report.title)}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {normalizeText(team?.name || "Unknown")} · {report.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReportId(report.id)}
                            className="h-9 w-9 shrink-0 p-0 hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav
        items={[
          {
            id: "overview",
            label: "Overview",
            icon: LayoutDashboard,
            active: activeSection === "overview",
            onClick: () => switchSection("overview"),
          },
          {
            id: "reports",
            label: "Reports",
            icon: FileText,
            active: activeSection === "reports",
            onClick: () => switchSection("reports"),
          },
        ]}
      />
    </div>
  )
}
