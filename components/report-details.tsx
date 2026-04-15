"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, User, Building, FileText, Pencil, X, Save, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Report, User as UserType, Team, ReportTemplate } from "@/lib/types"
import { normalizeText } from "@/lib/utils"
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button"

interface ReportDetailsProps {
  reportId: string
  onBack: () => void
  canEdit?: boolean
  currentUserId?: number
  onEditSuccess?: () => void
}

export default function ReportDetails({ reportId, onBack, canEdit, currentUserId, onEditSuccess }: ReportDetailsProps) {
  const [report, setReport] = useState<Report | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedAnswers, setEditedAnswers] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)

  useTelegramBackButton(true, onBack)

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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
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

  const handleStartEdit = () => {
    setEditedAnswers({ ...answers })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedAnswers({})
  }

  const handleSave = async () => {
    if (!report) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          answers: editedAnswers,
          ...(currentUserId !== undefined && { requestingUserId: currentUserId }),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save changes')
      }

      setReport({
        ...data.report,
        createdAt: new Date(data.report.createdAt),
        updatedAt: new Date(data.report.updatedAt),
      })
      setIsEditing(false)
      setEditedAnswers({})
      toast({ title: 'Report updated', description: 'Your changes have been saved.' })
      onEditSuccess?.()
    } catch (error: any) {
      console.error('Error saving report:', error)
      toast({ title: 'Save failed', description: error.message || 'Could not save changes.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const setFieldValue = (fieldId: string, value: any) => {
    setEditedAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  const renderEditField = (field: any, currentValue: any) => {
    const fieldType = (field.type || 'text').toLowerCase()
    const fieldId = field.id
    const editValue = editedAnswers[fieldId] ?? currentValue ?? ''

    // File/photo fields: read-only in edit mode (re-upload not supported inline)
    if (fieldType === 'photo' || fieldType === 'file') {
      return (
        <div className="space-y-1">
          {renderAnswerValue(currentValue)}
          <p className="text-[11px] text-muted-foreground italic">File fields cannot be changed here.</p>
        </div>
      )
    }

    if (fieldType === 'textarea') {
      return (
        <Textarea
          value={Array.isArray(editValue) ? editValue.join('\n') : String(editValue)}
          onChange={(e) => setFieldValue(fieldId, e.target.value)}
          className="min-h-[90px] text-sm"
          placeholder={field.placeholder || ''}
        />
      )
    }

    if ((fieldType === 'select' || fieldType === 'radio') && Array.isArray(field.options) && field.options.length > 0) {
      const options = field.options.map((opt: any) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt,
      )
      return (
        <Select
          value={String(editValue)}
          onValueChange={(val) => setFieldValue(fieldId, val)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: { value: string; label: string }) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (fieldType === 'number') {
      return (
        <Input
          type="number"
          value={String(editValue)}
          min={field.validation?.min}
          max={field.validation?.max}
          onChange={(e) => setFieldValue(fieldId, e.target.value)}
          className="h-9 text-sm"
          placeholder={field.placeholder || ''}
        />
      )
    }

    if (fieldType === 'date') {
      return (
        <Input
          type="date"
          value={String(editValue)}
          onChange={(e) => setFieldValue(fieldId, e.target.value)}
          className="h-9 text-sm"
        />
      )
    }

    // Default: text input (covers text, email, tel, checkbox, etc.)
    return (
      <Input
        type={fieldType === 'email' ? 'email' : fieldType === 'tel' ? 'tel' : 'text'}
        value={Array.isArray(editValue) ? editValue.join(', ') : String(editValue)}
        onChange={(e) => setFieldValue(fieldId, e.target.value)}
        className="h-9 text-sm"
        placeholder={field.placeholder || ''}
      />
    )
  }

  const renderAnswerValue = (rawValue: unknown) => {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return <span className="text-muted-foreground italic text-sm">No answer provided</span>
    }

    if (Array.isArray(rawValue)) {
      if (rawValue.length === 0) {
        return <span className="text-muted-foreground italic text-sm">No answer provided</span>
      }

      return (
        <div className="space-y-1">
          {rawValue.map((entry, index) => {
            const stringValue = String(entry)
            return (
              <div key={`${stringValue}-${index}`}>
                {isHttpUrl(stringValue) ? (
                  <a href={stringValue} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline break-all text-[15px]">
                    {stringValue}
                  </a>
                ) : (
                  <span className="text-[15px]">{normalizeText(stringValue)}</span>
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
        <a href={stringValue} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline break-all text-[15px]">
          {stringValue}
        </a>
      )
    }

    return <span className="text-[15px]">{normalizeText(stringValue)}</span>
  }

  const userName = user
    ? `${normalizeText(user.firstName)}${user.lastName ? ` ${normalizeText(user.lastName)}` : ''}`
    : 'Unknown'

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <Card className="glass border-glass-border">
        <CardContent className="pt-6 pb-5 space-y-4">
          {/* Title row with optional Edit button */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight">
                {normalizeText(report.title)}
              </h1>
              {report.description && (
                <p className="text-muted-foreground text-sm mt-1">
                  {normalizeText(report.description)}
                </p>
              )}
            </div>
            {canEdit && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartEdit}
                className="shrink-0 h-8 gap-1.5 text-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
            {isEditing && (
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="h-8 gap-1.5 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-8 gap-1.5 text-xs"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">{userName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">{normalizeText(team?.name || 'Unknown')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{report.createdAt.toLocaleDateString()}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{report.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {template && (
              <Badge variant="secondary" className="font-normal">
                <FileText className="w-3 h-3 mr-1" />
                {normalizeText(template.name)}
              </Badge>
            )}
            {report.category && (
              <Badge variant="secondary">{normalizeText(report.category)}</Badge>
            )}
            {report.priority && (
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
            )}
            {report.status && (
              <Badge variant="outline">{report.status}</Badge>
            )}
            {isEditing && (
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                Editing
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Answers */}
      <Card className="glass border-glass-border">
        <CardContent className="pt-5 pb-5 space-y-5">
          {templateFields.length > 0 ? (
            templateFields.map((field: any, idx: number) => {
              const value = answers[field.id]
              return (
                <div key={field.id}>
                  {idx > 0 && <div className="border-t border-border/40 mb-5" />}
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {normalizeText(field.label || field.question || field.id)}
                    {field.required && isEditing && <span className="text-destructive ml-1">*</span>}
                  </p>
                  <div className="text-foreground">
                    {isEditing ? renderEditField(field, value) : renderAnswerValue(value)}
                  </div>
                </div>
              )
            })
          ) : (
            Object.entries(isEditing ? editedAnswers : answers).map(([key, value], idx) => (
              <div key={key}>
                {idx > 0 && <div className="border-t border-border/40 mb-5" />}
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {normalizeText(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}
                </p>
                <div className="text-foreground">
                  {isEditing ? (
                    <Textarea
                      value={Array.isArray(value) ? (value as any[]).join('\n') : String(value ?? '')}
                      onChange={(e) => setFieldValue(key, e.target.value)}
                      className="min-h-[70px] text-sm"
                    />
                  ) : (
                    renderAnswerValue(value)
                  )}
                </div>
              </div>
            ))
          )}

          {Object.keys(answers).length === 0 && (
            <p className="text-muted-foreground text-center py-8">No data available for this report</p>
          )}
        </CardContent>
      </Card>

      {/* Footer meta */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-2">
        <span className="font-mono truncate max-w-[200px]" title={report.id}>{report.id}</span>
        <span>Updated {report.updatedAt.toLocaleString()}</span>
      </div>
    </div>
  )
}
