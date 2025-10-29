"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, TrendingUp, ExternalLink, Zap, UserCheck, Building2 } from "lucide-react"
import { type User, type Team, type Report } from "@/lib/types"
import TeamManagement from "@/components/team-management"
import ReportsView from "@/components/reports-view"
import UserManagement from "@/components/user-management"
import OverviewStats from "@/components/overview-stats"
import SheetsIntegrationStatus from "@/components/sheets-integration-status"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch users
        const usersResponse = await fetch('/api/users')
        const usersData = await usersResponse.json()
        const usersWithDates = (usersData.users || []).map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }))
        setUsers(usersWithDates)

        // Fetch teams
        const teamsResponse = await fetch('/api/teams')
        const teamsData = await teamsResponse.json()
        const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
          ...team,
          createdAt: new Date(team.createdAt)
        }))
        setTeams(teamsWithDates)

        // Fetch reports
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
      // Fetch users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      const usersWithDates = (usersData.users || []).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }))
      setUsers(usersWithDates)

      // Fetch teams
      const teamsResponse = await fetch('/api/teams')
      const teamsData = await teamsResponse.json()
      const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
        ...team,
        createdAt: new Date(team.createdAt)
      }))
      setTeams(teamsWithDates)

      // Fetch reports
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
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, teams, and reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 border rounded-lg bg-muted/30">
          <TabsTrigger
            value="overview"
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:border-1 data-[state=active]:border-white/20 rounded-md"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:border-1 data-[state=active]:border-white/20 rounded-md"
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-xs">Users</span>
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:border-1 data-[state=active]:border-white/20 rounded-md"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-xs">Teams</span>
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-background data-[state=active]:border-1 data-[state=active]:border-white/20 rounded-md"
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewStats stats={stats} />
          <SheetsIntegrationStatus />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 bg-transparent"
                  onClick={() => setActiveTab("users")}
                >
                  <div className="text-left">
                    <div className="font-medium">Manage Users</div>
                    <div className="text-sm text-muted-foreground">Edit user roles</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 bg-transparent"
                  onClick={() => setActiveTab("teams")}
                >
                  <div className="text-left">
                    <div className="font-medium">Create New Team</div>
                    <div className="text-sm text-muted-foreground">Add a new team</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 bg-transparent"
                  onClick={() => setActiveTab("reports")}
                >
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      View Reports <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="text-sm text-muted-foreground">Access all reports data</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest reports and team updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.slice(0, 5).map((report) => {
                  const user = users.find((u) => u.telegramId === report.userId)
                  const team = teams.find((t) => t.id === report.teamId)

                  return (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{report.title}</span>
                          <Badge
                            variant={
                              report.priority === "high"
                                ? "destructive"
                                : report.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {report.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {user?.firstName} {user?.lastName} • {team?.name} •{" "}
                          {report.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">{report.status}</Badge>
                    </div>
                  )
                })}

                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No reports yet</div>
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

        <TabsContent value="reports">
          <ReportsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
