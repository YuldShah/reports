"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ExternalLink, Calendar, User as UserIcon, Building, FileText, Eye, ChevronLeft, ChevronRight, FileJson } from "lucide-react"
import { type User, type Team, type Report } from "@/lib/types"
import ReportDetails from "@/components/report-details"
import { normalizeText } from "@/lib/utils"

export default function ReportsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetUrl, setSheetUrl] = useState<string | null>(null)
  const [sheetConfigured, setSheetConfigured] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchData()
    fetchSheetStatus()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch reports
      const reportsResponse = await fetch('/api/reports')
      const reportsData = await reportsResponse.json()
      const reportsWithDates = (reportsData.reports || []).map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt)
      }))
      setReports(reportsWithDates)

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

      // Fetch templates
      const templatesResponse = await fetch('/api/templates')
      const templatesData = await templatesResponse.json()
      const templatesWithDates = (templatesData.templates || []).map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt)
      }))
      setTemplates(templatesWithDates)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSheetStatus = async () => {
    try {
      const response = await fetch("/api/sheets")
      const data = await response.json()

      if (response.ok && data.sheetUrl) {
        setSheetUrl(data.sheetUrl)
        setSheetConfigured(Boolean(data.configured))
      } else {
        setSheetUrl(null)
        setSheetConfigured(false)
      }
    } catch (error) {
      console.error("Error fetching sheet status:", error)
      setSheetUrl(null)
      setSheetConfigured(false)
    }
  }

  const filteredReports = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm).toLowerCase()

    return reports.filter((report) => {
      const matchesSearch =
        normalizeText(report.title).toLowerCase().includes(normalizedSearchTerm) ||
        normalizeText(report.description).toLowerCase().includes(normalizedSearchTerm)
      const matchesTeam = teamFilter === "all" || report.teamId === teamFilter

      return matchesSearch && matchesTeam
    })
  }, [reports, searchTerm, teamFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, teamFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReports = filteredReports.slice(startIndex, endIndex)

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Reports Management</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  // Show report details if one is selected
  if (selectedReportId) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <ReportDetails reportId={selectedReportId} onBack={() => setSelectedReportId(null)} />
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Reports Management</h2>
          <p className="text-sm text-muted-foreground">View and manage all submitted reports</p>
        </div>
        {sheetConfigured && sheetUrl ? (
          <Button asChild variant="outline" className="bg-[#0f9d58] hover:bg-[#0d8a4e] text-white border-[#0f9d58] transition-transform active:scale-95 shadow-md hover:shadow-lg">
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Sheets
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="bg-muted text-muted-foreground border-muted cursor-not-allowed"
            disabled
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Sheets
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="surface-panel border-glass-border">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-colors focus:border-primary"
              />
            </div>

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="transition-colors focus:border-primary">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {normalizeText(team.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items per page selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-20 transition-colors focus:border-primary">
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
          Showing {filteredReports.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {paginatedReports.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="surface-panel border-glass-border">
                <CardContent className="text-center py-12">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius)+4px)] bg-muted/40">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-medium mb-2">No reports found</h3>
                  <p className="text-muted-foreground">
                    {reports.length === 0
                      ? "No reports have been submitted yet."
                      : "Try adjusting your filters to see more results."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            paginatedReports.map((report, idx) => {
              const user = users.find((u) => u.telegramId === report.userId)
              const team = teams.find((t) => t.id === report.teamId)
              const template = templates.find((t) => t.id === report.templateId)

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <Card className="surface-panel border-glass-border card-interactive hover:border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1 min-w-0">
                          <CardTitle className="font-heading text-lg leading-tight truncate">{normalizeText(report.title)}</CardTitle>
                          <CardDescription className="line-clamp-2 text-sm">{normalizeText(report.description)}</CardDescription>
                          {template && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
                              <FileJson className="w-3 h-3 text-primary/70" />
                              <span>{normalizeText(template.name)}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReportId(report.id)}
                          className="shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-transform active:scale-95 shadow-sm"
                        >
                          <Eye className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{normalizeText(user?.firstName)} {normalizeText(user?.lastName)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                          <Building className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{normalizeText(team?.name)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{report.createdAt.toLocaleDateString()}</span>
                        </div>
                        {report.category && (
                          <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                            {normalizeText(report.category)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card className="surface-panel border-glass-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 transition-transform active:scale-90"
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
                      className={`w-8 sm:w-10 px-0 transition-transform active:scale-90 ${currentPage === pageNumber ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}
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
                className="px-2 sm:px-3 transition-transform active:scale-90"
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
    </motion.div>
  )
}
