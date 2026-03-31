"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Building, FileText, Clock } from "lucide-react"
import type { Report, User as UserType, Team, ReportTemplate } from "@/lib/types"
import { normalizeText } from "@/lib/utils"

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

    fetchReportDetails()
  }, [reportId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="hover:bg-primary/10 hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="hover:bg-primary/10 hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="glass border-glass-border">
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
  const isHttpUrl = (rawValue: string) => /^https?:\/\//i.test(rawValue)

  const renderAnswerValue = (rawValue: unknown) => {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return <span className="text-muted-foreground italic">No answer provided</span>
    }

    if (Array.isArray(rawValue)) {
      if (rawValue.length === 0) {
        return <span className="text-muted-foreground italic">No answer provided</span>
      }

      return (
        <div className="space-y-1">
          {rawValue.map((entry, index) => {
            const stringValue = String(entry)
            return (
              <div key={`${stringValue}-${index}`} className="text-sm">
                {isHttpUrl(stringValue) ? (
                  <a href={stringValue} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline break-all">
                    {stringValue}
                  </a>
                ) : (
                  <span>{normalizeText(stringValue)}</span>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    const stringValue = String(rawValue)
    if (isHttpUrl(stringValue)) {
      return (
        <a href={stringValue} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline break-all">
          {stringValue}
        </a>
      )
    }

    return <span>{normalizeText(stringValue)}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="hover:bg-primary/10 hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Report Title Card */}
      <Card className="glass border-glass-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="font-heading text-2xl">{normalizeText(report.title)}</CardTitle>
              {report.description && (
                <CardDescription className="mt-2 text-base">
                  {normalizeText(report.description)}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-glass-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted by</p>
                <p className="font-medium">
                  {user ? `${normalizeText(user.firstName)}${user.lastName ? ` ${normalizeText(user.lastName)}` : ''}` : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-glass-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team</p>
                <p className="font-medium">{normalizeText(team?.name || 'Unknown')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-glass-border">
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

        <Card className="glass border-glass-border">
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
        <Card className="glass border-glass-border">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Template Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Template Name: </span>
              <span className="font-medium">{normalizeText(template.name)}</span>
            </div>
            {template.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description: </span>
                <span className="text-sm">{normalizeText(template.description)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Answers */}
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="font-heading">Report Details</CardTitle>
          <CardDescription>
            {template ? `Answers from ${normalizeText(template.name)} template` : 'Report data'}
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
                    {normalizeText(field.label || field.question || field.id)}
                  </p>
                  <div className="text-base">
                    {renderAnswerValue(value)}
                  </div>
                </div>
              )
            })
          ) : (
            // Display raw answers if no template
            Object.entries(answers).map(([key, value]) => (
              <div key={key} className="border-b last:border-0 pb-4 last:pb-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {normalizeText(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}
                </p>
                <div className="text-base">
                  {renderAnswerValue(value)}
                </div>
              </div>
            ))
          )}

          {Object.keys(answers).length === 0 && (
            <p className="text-muted-foreground text-center py-8">No data available for this report</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Metadata */}
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="font-heading">Additional Information</CardTitle>
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
              <Badge variant="secondary">{normalizeText(report.category)}</Badge>
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
