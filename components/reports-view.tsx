"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ExternalLink, Calendar, User, Building, FileText } from "lucide-react"
import { getAllReports, getAllUsers, getAllTeams } from "@/lib/database"

export default function ReportsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")
  const [sheetsUrl, setSheetsUrl] = useState("#")
  const [sheetsConfigured, setSheetsConfigured] = useState(false)

  const reports = getAllReports()
  const users = getAllUsers()
  const teams = getAllTeams()

  // Fetch Google Sheets URL on component mount
  useEffect(() => {
    const fetchSheetsUrl = async () => {
      try {
        const response = await fetch('/api/sheets')
        const data = await response.json()
        setSheetsUrl(data.url || "#")
        setSheetsConfigured(data.configured || false)
      } catch (error) {
        console.error('Failed to fetch sheets URL:', error)
        setSheetsUrl("#")
        setSheetsConfigured(false)
      }
    }
    fetchSheetsUrl()
  }, [])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || report.status === statusFilter
      const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter
      const matchesTeam = teamFilter === "all" || report.teamId === teamFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesTeam
    })
  }, [reports, searchTerm, statusFilter, priorityFilter, teamFilter])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in-progress":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports Management</h2>
          <p className="text-sm text-muted-foreground">View and manage all submitted reports</p>
        </div>
        <Button asChild variant="outline" className="bg-[#0f9d58] hover:bg-[#0d8a4e] text-black border-[#0f9d58]" disabled={!sheetsConfigured}>
          <a href={sheetsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            {sheetsConfigured ? "Open in Sheets" : "Sheets Not Configured"}
          </a>
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

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
                    <div className="flex gap-2 ml-4">
                      <Badge variant={getPriorityColor(report.priority)}>{report.priority}</Badge>
                      <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
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
