"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ExternalLink, Calendar, User as UserIcon, Building, FileText } from "lucide-react"
import { type User, type Team, type Report } from "@/lib/types"

export default function ReportsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetUrl, setSheetUrl] = useState<string | null>(null)
  const [sheetConfigured, setSheetConfigured] = useState(false)

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
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = teamFilter === "all" || report.teamId === teamFilter

      return matchesSearch && matchesTeam
    })
  }, [reports, searchTerm, teamFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold">Reports Management</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports Management</h2>
          <p className="text-sm text-muted-foreground">View and manage all submitted reports</p>
        </div>
        {sheetConfigured && sheetUrl ? (
          <Button asChild variant="outline" className="bg-[#0f9d58] hover:bg-[#0d8a4e] text-black border-[#0f9d58]">
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Open in Sheets
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="bg-muted text-muted-foreground border-muted cursor-not-allowed"
            disabled
          >
            <ExternalLink className="w-4 h-4" />
            Open in Sheets
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                className="pl-10"
              />
            </div>

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {reports.length === 0
                  ? "No reports have been submitted yet."
                  : "Try adjusting your filters to see more results."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const user = users.find((u) => u.telegramId === report.userId)
            const team = teams.find((t) => t.id === report.teamId)

            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {team?.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {report.createdAt.toLocaleDateString()}
                    </div>
                    {report.category && (
                      <Badge variant="outline" className="text-xs">
                        {report.category}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Summary */}
      {filteredReports.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Showing {filteredReports.length} of {reports.length} reports
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
