"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Building, FileText, Clock } from "lucide-react"
import type { Report, User as UserType, Team, ReportTemplate } from "@/lib/types"

interface ReportDetailsProps {
  reportId: string
  onBack: () => void
}

export default function ReportDetails({ reportId, onBack }: ReportDetailsProps) {
  const [report, setReport] = useState<Report | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportDetails()
  }, [reportId])

  const fetchReportDetails = async () => {
    try {
      setLoading(true)

      // Fetch all reports and find the one we need
      const reportsResponse = await fetch('/api/reports')
      const reportsData = await reportsResponse.json()
      const foundReport = reportsData.reports?.find((r: any) => r.id === reportId)

      if (!foundReport) {
        console.error('Report not found')
        setLoading(false)
        return
      }

      setReport({
        ...foundReport,
        createdAt: new Date(foundReport.createdAt),
        updatedAt: new Date(foundReport.updatedAt)
      })

      // Fetch user
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      const foundUser = usersData.users?.find((u: any) => u.telegramId === foundReport.userId)
      if (foundUser) {
        setUser({
          ...foundUser,
          createdAt: new Date(foundUser.createdAt)
        })
      }

      // Fetch team
      if (foundReport.teamId) {
        const teamResponse = await fetch(`/api/teams?id=${foundReport.teamId}`)
        const teamData = await teamResponse.json()
        if (teamData.team) {
          setTeam({
            ...teamData.team,
            createdAt: new Date(teamData.team.createdAt)
          })
        }
      }

      // Fetch template if available
      if (foundReport.templateId) {
        const templateResponse = await fetch(`/api/templates?id=${foundReport.templateId}`)
        const templateData = await templateResponse.json()
        if (templateData.template) {
          setTemplate({
            ...templateData.template,
            createdAt: new Date(templateData.template.createdAt)
          })
        }
      }
    } catch (error) {
      console.error('Error fetching report details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Report Not Found</h3>
            <p className="text-muted-foreground">This report could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const answers = report.answers || report.templateData || {}
  const templateFields = template ? ((template as any).questions || (template as any).fields || []) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Report Title Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{report.title}</CardTitle>
              {report.description && (
                <CardDescription className="mt-2 text-base">
                  {report.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted by</p>
                <p className="font-medium">
                  {user ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team</p>
                <p className="font-medium">{team?.name || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {report.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {report.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Info */}
      {template && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Template Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Template Name: </span>
              <span className="font-medium">{template.name}</span>
            </div>
            {template.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description: </span>
                <span className="text-sm">{template.description}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            {template ? `Answers from ${template.name} template` : 'Report data'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templateFields.length > 0 ? (
            // Display template-based answers with field labels
            templateFields.map((field: any) => {
              const value = answers[field.id]
              return (
                <div key={field.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {field.label || field.question || field.id}
                  </p>
                  <p className="text-base">
                    {value !== undefined && value !== null && value !== ''
                      ? String(value)
                      : <span className="text-muted-foreground italic">No answer provided</span>
                    }
                  </p>
                </div>
              )
            })
          ) : (
            // Display raw answers if no template
            Object.entries(answers).map(([key, value]) => (
              <div key={key} className="border-b last:border-0 pb-4 last:pb-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-base">
                  {value !== undefined && value !== null && value !== ''
                    ? String(value)
                    : <span className="text-muted-foreground italic">No answer provided</span>
                  }
                </p>
              </div>
            ))
          )}

          {Object.keys(answers).length === 0 && (
            <p className="text-muted-foreground text-center py-8">No data available for this report</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Report ID:</span>
            <span className="font-mono text-xs">{report.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{report.updatedAt.toLocaleString()}</span>
          </div>
          {report.category && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <Badge variant="secondary">{report.category}</Badge>
            </div>
          )}
          {report.priority && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
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
          )}
          {report.status && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline">{report.status}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
