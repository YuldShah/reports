"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Clock, CheckCircle, TrendingUp, Calendar } from "lucide-react"
import ReportForm from "@/components/report-form"
import type { User } from "@/lib/types"

interface EmployeeDashboardProps {
  user: User
}

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [showReportForm, setShowReportForm] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [userReports, setUserReports] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const debugLog = async (message: string, data?: any) => {
    try {
      await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          level: 'info',
          component: 'EmployeeDashboard',
          data
        })
      })
    } catch (err) {
      console.error('Debug log failed:', err)
    }
  }

  const refreshData = async () => {
    try {
      const [reportsRes, teamsRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/teams')
      ])
      
      const reportsData = await reportsRes.json()
      const teamsData = await teamsRes.json()
      
      const allReports = reportsData.reports || []
      const allTeams = teamsData.teams || teamsData || []
      
      const userReportsFiltered = allReports.filter((r: any) => r.userId === user.telegramId)
      
      // Fix: Convert date strings to Date objects
      const userReportsWithDates = userReportsFiltered.map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt)
      }))
      
      setUserReports(userReportsWithDates)
      setTeams(allTeams)
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        await debugLog('Starting fetchData', { userId: user.telegramId })
        
        const [reportsRes, teamsRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/teams')
        ])
        
        await debugLog('API responses received', { 
          reportsStatus: reportsRes.status, 
          teamsStatus: teamsRes.status 
        })
        
        const reportsData = await reportsRes.json()
        const teamsData = await teamsRes.json()
        
        await debugLog('Data parsed', { 
          reportsCount: reportsData?.reports?.length || 0,
          teamsCount: teamsData?.teams?.length || teamsData?.length || 0
        })
        
        // Fix: Extract reports array from the response
        const allReports = reportsData.reports || []
        const allTeams = teamsData.teams || teamsData || []
        
        const userReportsFiltered = allReports.filter((r: any) => r.userId === user.telegramId)
        
        // Fix: Convert date strings to Date objects
        const userReportsWithDates = userReportsFiltered.map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt)
        }))
        
        await debugLog('Data filtered', { 
          userReportsCount: userReportsWithDates.length,
          userTelegramId: user.telegramId
        })
        
        setUserReports(userReportsWithDates)
        setTeams(allTeams)
        setLoading(false)
        
        await debugLog('State updated successfully')
      } catch (error) {
        await debugLog('Error in fetchData', { error: error?.toString() })
        console.error('Failed to fetch data:', error)
        setLoading(false)
      }
    }
    fetchData()
  }, [user.telegramId])

  const userTeam = teams.find((t: any) => t.id === user.teamId)

  const stats = {
    totalReports: userReports.length,
    pendingReports: userReports.filter((r: any) => r.status === "pending").length,
    inProgressReports: userReports.filter((r: any) => r.status === "in-progress").length,
    completedReports: userReports.filter((r: any) => r.status === "completed").length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (showReportForm) {
    return (
      <div className="container mx-auto px-4 max-w-2xl">
        <ReportForm
          user={user}
          onCancel={() => setShowReportForm(false)}
          onSuccess={async () => {
            setShowReportForm(false)
            await refreshData() // Refresh data instead of page reload
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome, {user.firstName}!</h1>
        <p className="text-muted-foreground">Team: {userTeam?.name || "No team assigned"}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            My Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Action */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Submit New Report
              </CardTitle>
              <CardDescription>Report issues, feedback, or updates to your team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowReportForm(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Create Report
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-white/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stats.totalReports}</div>
              </CardContent>
            </Card>

            <Card className="border border-white/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stats.pendingReports}</div>
              </CardContent>
            </Card>

            <Card className="border border-white/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stats.inProgressReports}</div>
              </CardContent>
            </Card>

            <Card className="border border-white/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stats.completedReports}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <Card className="border border-white/20">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your latest submitted reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userReports.slice(0, 3).map((report) => (
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
                        {report.category} • {report.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">{report.status}</Badge>
                  </div>
                ))}

                {userReports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No reports submitted yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">My Reports</h2>
              <p className="text-sm text-muted-foreground">All your submitted reports</p>
            </div>
          </div>

          <div className="space-y-4">
            {userReports.length === 0 ? (
              <Card className="border border-white/20">
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reports yet</h3>
                  <p className="text-muted-foreground mb-4">Submit your first report to get started</p>
                  <Button onClick={() => setShowReportForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              userReports.map((report) => (
                <Card key={report.id} className="border border-white/20 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{report.description}</CardDescription>
                      </div>
                      <div className="flex gap-2 ml-4">
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
                        <Badge variant="outline">{report.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {report.createdAt.toLocaleDateString()}
                      </div>
                      {report.category && (
                        <Badge variant="outline" className="text-xs">
                          {report.category}
                        </Badge>
                      )}
                      {report.updatedAt.getTime() !== report.createdAt.getTime() && (
                        <div className="text-xs">Updated: {report.updatedAt.toLocaleDateString()}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
