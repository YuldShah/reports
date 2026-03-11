"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, FileText, TrendingUp, Calendar, Users, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import ReportForm from "@/components/report-form"
import ReportDetails from "@/components/report-details"
import StudentTracker from "@/components/student-tracker"
import type { User } from "@/lib/types"

interface EmployeeDashboardProps {
  user: User
}

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [showReportForm, setShowReportForm] = useState(false)
  const [showTemplateSelection, setShowTemplateSelection] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [userReports, setUserReports] = useState<any[]>([])
  const [allReports, setAllReports] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
      const [reportsRes, teamsRes, templatesRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/teams'),
        fetch('/api/templates')
      ])

      const reportsData = await reportsRes.json()
      const teamsData = await teamsRes.json()
      const templatesData = await templatesRes.json()

      const fetchedReports = reportsData.reports || []
      const allTeams = teamsData.teams || teamsData || []
      const allTemplates = templatesData.templates || []

      const reportsWithDates = fetchedReports.map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt)
      }))

      const userReportsFiltered = reportsWithDates.filter((r: any) => r.userId === user.telegramId)

      setAllReports(reportsWithDates)
      setUserReports(userReportsFiltered)
      setTeams(allTeams)
      setTemplates(allTemplates)
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        await debugLog('Starting fetchData', { userId: user.telegramId })

        const [reportsRes, teamsRes, templatesRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/teams'),
          fetch('/api/templates')
        ])

        await debugLog('API responses received', {
          reportsStatus: reportsRes.status,
          teamsStatus: teamsRes.status,
          templatesStatus: templatesRes.status
        })

        const reportsData = await reportsRes.json()
        const teamsData = await teamsRes.json()
        const templatesData = await templatesRes.json()

        await debugLog('Data parsed', {
          reportsCount: reportsData?.reports?.length || 0,
          teamsCount: teamsData?.teams?.length || teamsData?.length || 0,
          templatesCount: templatesData?.templates?.length || 0
        })

        const fetchedReports = reportsData.reports || []
        const allTeams = teamsData.teams || teamsData || []
        const allTemplates = templatesData.templates || []

        const reportsWithDates = fetchedReports.map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt)
        }))

        const userReportsFiltered = reportsWithDates.filter((r: any) => r.userId === user.telegramId)

        await debugLog('Data filtered', {
          userReportsCount: userReportsFiltered.length,
          userTelegramId: user.telegramId
        })

        setAllReports(reportsWithDates)
        setUserReports(userReportsFiltered)
        setTeams(allTeams)
        setTemplates(allTemplates)
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

  const teamReports = user.teamId
    ? allReports.filter((r: any) => r.teamId === user.teamId)
    : []

  const stats = {
    totalReports: userReports.length,
    teamReports: teamReports.length,
  }

  const totalPages = Math.ceil(userReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReports = userReports.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const userTeamTemplates = userTeam?.templateIds
    ? templates.filter((t: any) => userTeam.templateIds.includes(t.id))
    : []

  const studentTrackerTemplate = userTeamTemplates.find((t: any) => t.isStudentTracker)

  if (showTemplateSelection) {
    return (
      <div className="container mx-auto max-w-2xl">
        <div className="space-y-6">
          <div>
            <button
              onClick={() => {
                setShowTemplateSelection(false)
                setSelectedTemplateId(null)
              }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <h2 className="font-heading text-2xl font-bold tracking-tight">Select Template</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose a template for your report</p>
          </div>

          {userTeamTemplates.length === 0 ? (
            <Card className="glass border-glass-border">
              <CardContent className="text-center py-12">
                <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-lg font-medium mb-2">No Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Your team doesn&apos;t have any templates assigned yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 stagger-children">
              {userTeamTemplates.map((template: any) => (
                <Card
                  key={template.id}
                  className="glass border-glass-border card-interactive cursor-pointer hover:border-primary/30"
                  onClick={() => {
                    setSelectedTemplateId(template.id)
                    setShowTemplateSelection(false)
                    setShowReportForm(true)
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="font-heading text-base">{template.name}</CardTitle>
                        <CardDescription className="mt-0.5 text-xs line-clamp-2">
                          {template.description || "No description"}
                        </CardDescription>
                        <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/40 text-muted-foreground">
                          {template.questions?.length || 0} fields
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (showReportForm) {
    return (
      <div className="container mx-auto max-w-2xl">
        <ReportForm
          user={user}
          templateId={selectedTemplateId}
          onCancel={() => {
            setShowReportForm(false)
            setSelectedTemplateId(null)
          }}
          onSuccess={async () => {
            setShowReportForm(false)
            setSelectedTemplateId(null)
            await refreshData()
          }}
        />
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
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Welcome, {user.firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">{userTeam?.name || "No team assigned"}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 glass border-glass-border rounded-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 py-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">My Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          {/* Submit CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">New Report</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Submit updates to your team</p>
                </div>
                <Button
                  onClick={() => setShowTemplateSelection(true)}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          {studentTrackerTemplate && (
            <StudentTracker
              user={user}
              template={studentTrackerTemplate}
              onSuccess={refreshData}
            />
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="glass border-glass-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">My Reports</span>
                  <div className="w-7 h-7 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-chart-2" />
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold tracking-tight">{stats.totalReports}</div>
              </CardContent>
            </Card>

            <Card className="glass border-glass-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Team Reports</span>
                  <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-success" />
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold tracking-tight">{stats.teamReports}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <Card className="glass border-glass-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base">Recent Reports</CardTitle>
              <CardDescription className="text-xs">Your latest submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userReports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">{report.title}</span>
                        {report.priority === "high" && (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">high</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {report.category} · {report.createdAt.toLocaleDateString()}
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
                ))}

                {userReports.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">No reports submitted yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading text-lg font-semibold">My Reports</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All your submitted reports</p>
            </div>
          </div>

          {userReports.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-16 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, userReports.length)} of {userReports.length}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {userReports.length === 0 ? (
              <Card className="glass border-glass-border">
                <CardContent className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-medium mb-2">No reports yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Submit your first report to get started</p>
                  <Button onClick={() => setShowTemplateSelection(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              paginatedReports.map((report) => (
                <Card key={report.id} className="glass border-glass-border card-interactive">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight truncate">{report.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{report.description}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {report.priority === "high" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">high</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground font-medium">{report.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {report.createdAt.toLocaleDateString()}
                        </span>
                        {report.category && (
                          <span className="px-1.5 py-0.5 rounded bg-muted/30 text-[10px]">{report.category}</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedReportId(report.id)}
                        className="h-7 text-xs hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                let pageNumber: number
                if (totalPages <= 3) {
                  pageNumber = i + 1
                } else if (currentPage <= 2) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 1) {
                  pageNumber = totalPages - 2 + i
                } else {
                  pageNumber = currentPage - 1 + i
                }
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className={`h-8 w-8 p-0 text-xs ${currentPage === pageNumber ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {pageNumber}
                  </Button>
                )
              })}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
