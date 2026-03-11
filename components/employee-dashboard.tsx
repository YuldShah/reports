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

      // Convert date strings to Date objects for all reports
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

        // Fix: Extract reports array from the response
        const fetchedReports = reportsData.reports || []
        const allTeams = teamsData.teams || teamsData || []
        const allTemplates = templatesData.templates || []

        // Fix: Convert date strings to Date objects for all reports
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

  // Calculate team reports (all reports from users in the same team)
  const teamReports = user.teamId
    ? allReports.filter((r: any) => r.teamId === user.teamId)
    : []

  const stats = {
    totalReports: userReports.length,
    teamReports: teamReports.length,
  }

  // Pagination calculations for My Reports tab
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // Get templates assigned to user's team
  const userTeamTemplates = userTeam?.templateIds
    ? templates.filter((t: any) => userTeam.templateIds.includes(t.id))
    : []

  // Check if user has a student tracker template
  const studentTrackerTemplate = userTeamTemplates.find((t: any) => t.isStudentTracker)

  if (showTemplateSelection) {
    return (
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-6">
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setShowTemplateSelection(false)
                setSelectedTemplateId(null)
              }}
              className="mb-4"
            >
              ← Back
            </Button>
            <h2 className="text-2xl font-bold">Select Report Template</h2>
            <p className="text-muted-foreground">Choose a template for your report</p>
          </div>

          {userTeamTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
                <p className="text-muted-foreground mb-4">
                  Your team doesn&apos;t have any templates assigned. Please contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userTeamTemplates.map((template: any) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setSelectedTemplateId(template.id)
                    setShowTemplateSelection(false)
                    setShowReportForm(true)
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description || "No description available"}
                        </CardDescription>
                        <Badge variant="secondary" className="mt-2">
                          {template.questions?.length || 0} fields
                        </Badge>
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
      <div className="container mx-auto px-4 max-w-2xl">
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
            await refreshData() // Refresh data instead of page reload
          }}
        />
      </div>
    )
  }

  // Show report details if one is selected
  if (selectedReportId) {
    return (
      <div className="container mx-auto px-4 max-w-4xl">
        <ReportDetails reportId={selectedReportId} onBack={() => setSelectedReportId(null)} />
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
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-2 px-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex flex-col items-center gap-1 py-2 px-2">
            <FileText className="w-5 h-5" />
            <span className="text-xs">My Reports</span>
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
              <Button onClick={() => setShowTemplateSelection(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Create Report
              </Button>
            </CardContent>
          </Card>

          {/* Student Distribution Tracker - only show if user has tracker template */}
          {studentTrackerTemplate && (
            <StudentTracker
              user={user}
              template={studentTrackerTemplate}
              onSuccess={refreshData}
            />
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-white/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">My Reports</CardTitle>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stats.totalReports}</div>
                <p className="text-xs text-muted-foreground mt-1">Reports submitted by you</p>
              </CardContent>
            </Card>

            <Card className="border border-white/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Team Reports</CardTitle>
                  <Users className="w-4 h-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stats.teamReports}</div>
                <p className="text-xs text-muted-foreground mt-1">Total reports from your team</p>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.status}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedReportId(report.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
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

          {/* Items per page selector */}
          {userReports.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, userReports.length)} of {userReports.length} reports
              </div>
            </div>
          )}

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
              paginatedReports.map((report) => (
                <Card key={report.id} className="border border-white/20 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight mb-1">{report.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">{report.description}</CardDescription>
                      </div>
                      <div className="flex gap-2 shrink-0">
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
                  <CardContent className="pt-0 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReportId(report.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                      // Show 3 pages on mobile for compact display
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
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className="w-8 sm:w-10 px-0"
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Page {currentPage} of {totalPages}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
