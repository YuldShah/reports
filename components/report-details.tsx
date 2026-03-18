"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Building, FileText, Clock } from "lucide-react"
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Report Title Card */}
      <motion.div variants={itemVariants}>
        <Card className="surface-panel border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="font-heading text-2xl">{normalizeText(report.title)}</CardTitle>
                {report.description && (
                  <CardDescription className="mt-2 text-base text-foreground/80">
                    {normalizeText(report.description)}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Metadata */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="surface-panel border-glass-border">
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

        <Card className="surface-panel border-glass-border">
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

        <Card className="surface-panel border-glass-border">
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

        <Card className="surface-panel border-glass-border">
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
      </motion.div>

      {/* Template Info */}
      {template && (
        <motion.div variants={itemVariants}>
          <Card className="surface-panel border-glass-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground min-w-[100px]">Template Name: </span>
                <span className="font-medium text-sm">{normalizeText(template.name)}</span>
              </div>
              {template.description && (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground min-w-[100px]">Description: </span>
                  <span className="text-sm">{normalizeText(template.description)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Report Answers */}
      <motion.div variants={itemVariants}>
        <Card className="surface-panel border-glass-border">
          <CardHeader>
            <CardTitle className="font-heading">Report Details</CardTitle>
            <CardDescription>
              {template ? `Answers from ${normalizeText(template.name)} template` : 'Report data'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templateFields.length > 0 ? (
              // Display template-based answers with field labels
              templateFields.map((field: any, idx: number) => {
                const value = answers[field.id]
                const isPhoto = field.type === 'photo'

                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.05) }}
                    key={field.id} 
                    className="border-b border-border/50 last:border-0 pb-4 last:pb-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {normalizeText(field.label || field.question || field.id)}
                    </p>
                    
                    {isPhoto ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {value && value !== '[]' ? (
                          (() => {
                            try {
                              const parsed = JSON.parse(value)
                              if (Array.isArray(parsed)) {
                                return parsed.map((base64: string, i: number) => (
                                  <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={base64} alt={`Attachment ${i}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                                  </div>
                                ))
                              }
                              return <span className="text-muted-foreground/60 italic">Invalid photo data</span>
                            } catch (e) {
                              return <span className="text-muted-foreground/60 italic">Error displaying photos</span>
                            }
                          })()
                        ) : (
                          <span className="text-muted-foreground/60 italic">No photos provided</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed">
                        {value !== undefined && value !== null && value !== ''
                          ? normalizeText(String(value))
                          : <span className="text-muted-foreground/60 italic">No answer provided</span>
                        }
                      </p>
                    )}
                  </motion.div>
                )
              })
            ) : (
              // Display raw answers if no template
              Object.entries(answers).map(([key, value], idx: number) => {
                const isLikelyPhotoArray = typeof value === 'string' && value.startsWith('["data:image/')
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.05) }}
                    key={key} 
                    className="border-b border-border/50 last:border-0 pb-4 last:pb-0"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {normalizeText(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}
                    </p>
                    
                    {isLikelyPhotoArray ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                          try {
                            const parsed = JSON.parse(value as string)
                            if (Array.isArray(parsed)) {
                              return parsed.map((base64: string, i: number) => (
                                <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={base64} alt={`Attachment ${i}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                                </div>
                              ))
                            }
                            return <span className="text-muted-foreground/60 italic">Invalid photo data</span>
                          } catch (e) {
                            return <span className="text-muted-foreground/60 italic">Error displaying photos</span>
                          }
                        })()}
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed">
                        {value !== undefined && value !== null && value !== ''
                          ? normalizeText(String(value))
                          : <span className="text-muted-foreground/60 italic">No answer provided</span>
                        }
                      </p>
                    )}
                  </motion.div>
                )
              })
            )}

            {Object.keys(answers).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No data available for this report</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Metadata */}
      <motion.div variants={itemVariants}>
        <Card className="surface-panel border-glass-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/30">
              <span className="text-muted-foreground">Report ID:</span>
              <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">{report.id}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/30">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{report.updatedAt.toLocaleString()}</span>
            </div>
            {report.category && (
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="secondary" className="font-normal">{normalizeText(report.category)}</Badge>
              </div>
            )}
            {report.priority && (
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground">Priority:</span>
                <Badge
                  className="font-normal"
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
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="font-normal">{report.status}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
