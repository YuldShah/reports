"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, TrendingUp, ExternalLink, Zap, UserCheck, Building2, FileJson, Eye } from "lucide-react"
import { type User, type Team, type Report } from "@/lib/types"
import TeamManagement from "@/components/team-management"
import ReportsView from "@/components/reports-view"
import UserManagement from "@/components/user-management"
import OverviewStats from "@/components/overview-stats"
import SheetsIntegrationStatus from "@/components/sheets-integration-status"
import TemplateManagement from "@/components/template-management"
import ReportDetails from "@/components/report-details"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const usersResponse = await fetch('/api/users')
        const usersData = await usersResponse.json()
        const usersWithDates = (usersData.users || []).map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }))
        setUsers(usersWithDates)

        const teamsResponse = await fetch('/api/teams')
        const teamsData = await teamsResponse.json()
        const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
          ...team,
          createdAt: new Date(team.createdAt)
        }))
        setTeams(teamsWithDates)

        const reportsResponse = await fetch('/api/reports')
        const reportsData = await reportsResponse.json()
        const reportsWithDates = (reportsData.reports || []).map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt)
        }))
        setReports(reportsWithDates)
      } catch (error) {
        console.error('Error fetching data:', error)
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
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      const usersWithDates = (usersData.users || []).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }))
      setUsers(usersWithDates)

      const teamsResponse = await fetch('/api/teams')
      const teamsData = await teamsResponse.json()
      const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
        ...team,
        createdAt: new Date(team.createdAt)
      }))
      setTeams(teamsWithDates)

      const reportsResponse = await fetch('/api/reports')
      const reportsData = await reportsResponse.json()
      const reportsWithDates = (reportsData.reports || []).map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt)
      }))
      setReports(reportsWithDates)
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (selectedReportId) {
    return (
      <div className="container mx-auto max-w-4xl">
        <ReportDetails reportId={selectedReportId} onBack={() => setSelectedReportId(null)} />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, teams, and reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 glass border-glass-border rounded-xl">
          <TabsTrigger
            value="overview"
            className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[11px] font-medium">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[11px] font-medium">Users</span>
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[11px] font-medium">Teams</span>
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <FileJson className="w-4 h-4" />
            <span className="text-[11px] font-medium">Templates</span>
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-medium">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewStats stats={stats} />
          <SheetsIntegrationStatus />

          {/* Quick Actions */}
          <Card className="glass border-glass-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className="text-sm font-medium text-foreground">Manage Users</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Edit user roles</div>
                </button>
                <button
                  onClick={() => setActiveTab("teams")}
                  className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className="text-sm font-medium text-foreground">Create Team</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Add a new team</div>
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    View Reports <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Access all reports</div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass border-glass-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest reports and team updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.slice(0, 5).map((report) => {
                  const user = users.find((u) => u.telegramId === report.userId)
                  const team = teams.find((t) => t.id === report.teamId)

                  return (
                    <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm truncate">{report.title}</span>
                          {report.priority === "high" && (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">
                              high
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user?.firstName} {user?.lastName} · {team?.name} · {report.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedReportId(report.id)}
                        className="shrink-0 h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}

                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No reports yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement onDataChange={refreshData} />
        </TabsContent>

        <TabsContent value="teams">
          <TeamManagement onDataChange={refreshData} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManagement onDataChange={refreshData} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
