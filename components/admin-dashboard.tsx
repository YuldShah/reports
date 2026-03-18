"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  ExternalLink,
  Eye,
  FileJson,
  FileText,
  LayoutDashboard,
  UserCheck,
  Users,
  Zap,
} from "lucide-react"

import BottomNav from "@/components/bottom-nav"
import ReportDetails from "@/components/report-details"
import ReportsView from "@/components/reports-view"
import SheetsIntegrationStatus from "@/components/sheets-integration-status"
import TeamManagement from "@/components/team-management"
import TemplateManagement from "@/components/template-management"
import UserManagement from "@/components/user-management"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button"
import { type Report, type Team, type User } from "@/lib/types"
import { normalizeText } from "@/lib/utils"

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  useTelegramBackButton(!!selectedReportId, () => {
    setSelectedReportId(null)
  })

  // Scroll to top only when entering report details, not on tab switches
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [selectedReportId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const usersResponse = await fetch("/api/users")
        const usersData = await usersResponse.json()
        const usersWithDates = (usersData.users || []).map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
        }))
        setUsers(usersWithDates)

        const teamsResponse = await fetch("/api/teams")
        const teamsData = await teamsResponse.json()
        const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
          ...team,
          createdAt: new Date(team.createdAt),
        }))
        setTeams(teamsWithDates)

        const reportsResponse = await fetch("/api/reports")
        const reportsData = await reportsResponse.json()
        const reportsWithDates = (reportsData.reports || []).map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt),
        }))
        setReports(reportsWithDates)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = {
    totalUsers: users.length,
    totalTeams: teams.length,
    totalReports: reports.length,
  }

  const refreshData = async () => {
    try {
      const usersResponse = await fetch("/api/users")
      const usersData = await usersResponse.json()
      const usersWithDates = (usersData.users || []).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
      }))
      setUsers(usersWithDates)

      const teamsResponse = await fetch("/api/teams")
      const teamsData = await teamsResponse.json()
      const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
        ...team,
        createdAt: new Date(team.createdAt),
      }))
      setTeams(teamsWithDates)

      const reportsResponse = await fetch("/api/reports")
      const reportsData = await reportsResponse.json()
      const reportsWithDates = (reportsData.reports || []).map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt),
      }))
      setReports(reportsWithDates)
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      </div>
    )
  }

  if (selectedReportId) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-auto max-w-4xl pb-12"
      >
        <ReportDetails reportId={selectedReportId} onBack={() => setSelectedReportId(null)} />
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
          {activeSection === "overview" && (
            <div className="space-y-6">
              <Card className="surface-panel overflow-hidden border-primary/20 bg-gradient-to-br from-primary/12 via-card/92 to-card/70">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Reports Control</h1>
                      <p className="text-sm text-muted-foreground">Manage users, teams, templates, and incoming reports from one place.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 lg:min-w-[360px]">
                      <div className="rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm card-interactive hover:border-primary/30">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Users</span>
                          <Users className="h-4 w-4 text-chart-2" />
                        </div>
                        <div className="font-heading text-3xl font-bold tracking-tight">{stats.totalUsers}</div>
                      </div>

                      <div className="rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm card-interactive hover:border-primary/30">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Teams</span>
                          <Building2 className="h-4 w-4 text-success" />
                        </div>
                        <div className="font-heading text-3xl font-bold tracking-tight">{stats.totalTeams}</div>
                      </div>

                      <div className="rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm card-interactive hover:border-primary/30">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Reports</span>
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-heading text-3xl font-bold tracking-tight">{stats.totalReports}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SheetsIntegrationStatus />

              <Card className="surface-panel border-glass-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-heading text-base">
                    <Zap className="h-4 w-4 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <button
                      onClick={() => setActiveSection("users")}
                      className="cursor-pointer rounded-[calc(var(--radius)+2px)] border border-border/80 bg-background/70 p-4 text-left transition-all hover:border-primary/30 active:scale-95"
                    >
                      <div className="text-sm font-medium text-foreground">Manage Users</div>
                      <div className="mt-1 text-xs text-muted-foreground">Review access and roles.</div>
                    </button>
                    <button
                      onClick={() => setActiveSection("teams")}
                      className="cursor-pointer rounded-[calc(var(--radius)+2px)] border border-border/80 bg-background/70 p-4 text-left transition-all hover:border-primary/30 active:scale-95"
                    >
                      <div className="text-sm font-medium text-foreground">Organize Teams</div>
                      <div className="mt-1 text-xs text-muted-foreground">Assign structures and templates.</div>
                    </button>
                    <button
                      onClick={() => setActiveSection("reports")}
                      className="cursor-pointer rounded-[calc(var(--radius)+2px)] border border-border/80 bg-background/70 p-4 text-left transition-all hover:border-primary/30 active:scale-95"
                    >
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Review Reports
                        <ExternalLink className="h-3 w-3" />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Jump straight into submissions.</div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-panel border-glass-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-base">Recent Activity</CardTitle>
                  <CardDescription className="text-xs">Latest report flow with cleaned display text.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 stagger-children">
                    {reports.slice(0, 5).map((report) => {
                      const relatedUser = users.find((user) => user.telegramId === report.userId)
                      const relatedTeam = teams.find((team) => team.id === report.teamId)

                      return (
                        <div
                          key={report.id}
                          className="flex items-center justify-between gap-3 rounded-[calc(var(--radius)+2px)] border border-border/80 bg-background/65 p-3 card-interactive"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{normalizeText(report.title)}</span>
                              {report.priority === "high" && (
                                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                                  high
                                </span>
                              )}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {normalizeText(relatedUser?.firstName || "Unknown")}
                              {relatedUser?.lastName ? ` ${normalizeText(relatedUser.lastName)}` : ""}
                              {" · "}
                              {normalizeText(relatedTeam?.name || "Unknown")}
                              {" · "}
                              {report.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReportId(report.id)}
                            className="h-9 w-9 shrink-0 p-0 hover:bg-primary/10 hover:text-primary transition-transform active:scale-95"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}

                    {reports.length === 0 && (
                      <div className="py-10 text-center text-sm text-muted-foreground">No reports yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "users" && <UserManagement onDataChange={refreshData} />}
          {activeSection === "teams" && <TeamManagement onDataChange={refreshData} />}
          {activeSection === "templates" && <TemplateManagement onDataChange={refreshData} />}
          {activeSection === "reports" && <ReportsView />}
        </motion.div>
      </AnimatePresence>

      <BottomNav
        items={[
          {
            id: "overview",
            label: "Overview",
            icon: LayoutDashboard,
            active: activeSection === "overview",
            onClick: () => setActiveSection("overview"),
          },
          {
            id: "users",
            label: "Users",
            icon: UserCheck,
            active: activeSection === "users",
            onClick: () => setActiveSection("users"),
          },
          {
            id: "reports",
            label: "Reports",
            icon: FileText,
            active: activeSection === "reports",
            onClick: () => setActiveSection("reports"),
          },
          {
            id: "teams",
            label: "Teams",
            icon: Building2,
            active: activeSection === "teams",
            onClick: () => setActiveSection("teams"),
          },
          {
            id: "templates",
            label: "Templates",
            icon: FileJson,
            active: activeSection === "templates",
            onClick: () => setActiveSection("templates"),
          },
        ]}
      />
    </div>
  )
}
