"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { ArrowLeft, Send, AlertCircle, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { User, Team, ReportTemplate, TemplateField } from "@/lib/types"

interface ReportFormProps {
  user: User
  templateId?: string | null
  onCancel: () => void
  onSuccess: () => void
}

export default function ReportForm({ user, templateId, onCancel, onSuccess }: ReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [team, setTeam] = useState<Team | null>(null)
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Default form data for non-template forms
  const [defaultFormData, setDefaultFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  })

  const categories = [
    "Technical Issue",
    "Bug Report", 
    "Feature Request",
    "Process Improvement",
    "Safety Concern",
    "Equipment Issue",
    "Training Need",
    "Other",
  ]

  useEffect(() => {
    const fetchTeamAndTemplate = async () => {
      if (!user.teamId) {
        setLoading(false)
        return
      }

      try {
        // Fetch team data
        const teamResponse = await fetch(`/api/teams?id=${user.teamId}`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeam(teamData.team)
        }

        // If templateId prop is provided, fetch that specific template
        if (templateId) {
          const templateResponse = await fetch(`/api/templates?id=${templateId}`)
          if (templateResponse.ok) {
            const templateData = await templateResponse.json()
            setTemplate(templateData.template)

            // Initialize form data based on template fields
            const initialFormData: Record<string, any> = {}
            const fields = templateData.template.questions || templateData.template.fields || []
            fields.forEach((field: TemplateField) => {
              initialFormData[field.id] = field.type === 'number' ? '' : ''
            })
            setFormData(initialFormData)
          }
        }
      } catch (error) {
        console.error('Error fetching team/template data:', error)
        toast({
          title: "Warning",
          description: "Failed to load template. Using default form.",
          variant: "default",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeamAndTemplate()
  }, [user.teamId, templateId])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (template) {
      // Validate template fields (support both 'questions' and 'fields' for compatibility)
      const fields = (template as any).questions || (template as any).fields || []
      fields.forEach((field: TemplateField) => {
        if (field.required) {
          const value = formData[field.id]
          if (!value || (typeof value === 'string' && !value.trim())) {
            errors[field.id] = `${field.label.replace('*', '')} is required`
          }
          
          // Additional validation for number fields
          if (field.type === 'number' && value) {
            const numValue = Number(value)
            if (isNaN(numValue)) {
              errors[field.id] = `${field.label.replace('*', '')} must be a number`
            } else if (field.validation?.min !== undefined && numValue < field.validation.min) {
              errors[field.id] = `${field.label.replace('*', '')} must be at least ${field.validation.min}`
            } else if (field.validation?.max !== undefined && numValue > field.validation.max) {
              errors[field.id] = `${field.label.replace('*', '')} must be at most ${field.validation.max}`
            }
          }
        }
      })
    } else {
      // Validate default form
      if (!defaultFormData.title.trim()) {
        errors.title = "Title is required"
      }
      if (!defaultFormData.description.trim()) {
        errors.description = "Description is required"
      }
      if (!defaultFormData.category) {
        errors.category = "Category is required"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!user.teamId) {
      toast({
        title: "Error",
        description: "You must be assigned to a team to submit reports",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let reportData: any
      
      if (template) {
        // For template-based forms
        const fields = (template as any).questions || (template as any).fields || []
        const titleField = fields.find((f: TemplateField) => f.id === 'title' || f.id === 'event_name')
        const descriptionField = fields.find((f: TemplateField) => f.id === 'description')
        
        reportData = {
          userId: user.telegramId,
          teamId: user.teamId,
          templateId: template.id,
          title: titleField ? formData[titleField.id] || 'Template Report' : 'Template Report',
          description: descriptionField ? formData[descriptionField.id] || JSON.stringify(formData, null, 2) : JSON.stringify(formData, null, 2),
          priority: "medium",
          status: "pending",
          category: "Template Report",
          templateData: formData,
          answers: formData,
        }
      } else {
        // For default forms
        reportData = {
          userId: user.telegramId,
          teamId: user.teamId,
          templateId: templateId || (team?.templateIds && team.templateIds.length > 0 ? team.templateIds[0] : null),
          title: defaultFormData.title,
          description: defaultFormData.description,
          priority: defaultFormData.priority,
          status: "pending",
          category: defaultFormData.category,
          templateData: defaultFormData,
          answers: {
            title: defaultFormData.title,
            description: defaultFormData.description,
            category: defaultFormData.category,
            priority: defaultFormData.priority,
          },
        }
      }

      // Create report via API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })

      if (!response.ok) {
        throw new Error('Failed to create report')
      }

      toast({
        title: "Success",
        description: "Report submitted successfully",
      })

      onSuccess()
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTemplateField = (field: TemplateField) => {
    const value = formData[field.id] || ''
    const hasError = !!formErrors[field.id]

    const handleFieldChange = (newValue: string) => {
      setFormData(prev => ({
        ...prev,
        [field.id]: newValue
      }))
      
      // Clear error when user starts typing
      if (hasError) {
        setFormErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field.id]
          return newErrors
        })
      }
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className={hasError ? "text-destructive" : ""}>
          {field.label}
        </Label>
        
        {field.type === 'text' && (
          <Input
            id={field.id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={hasError ? "border-destructive" : ""}
          />
        )}
        
        {field.type === 'textarea' && (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={hasError ? "border-destructive" : ""}
            rows={3}
          />
        )}
        
        {field.type === 'number' && (
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={hasError ? "border-destructive" : ""}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )}
        
        {field.type === 'date' && (
          <DatePicker
            value={value}
            onChange={handleFieldChange}
            placeholder={field.placeholder || "Sanani tanlang"}
            hasError={hasError}
          />
        )}

        {field.type === 'select' && Array.isArray(field.options) && field.options.length > 0 && (
          <Select value={value} onValueChange={handleFieldChange}>
            <SelectTrigger id={field.id} className={hasError ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder || "Tanlang"} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {hasError && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {formErrors[field.id]}
          </p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Loading...</h1>
            <p className="text-sm text-muted-foreground">Preparing report form</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting} className="self-start hover:bg-primary/10 hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Submit Report</h1>
          <p className="text-sm text-muted-foreground">
            {template ? `Using ${template.name} template` : "Fill out the form below to submit your report"}
          </p>
        </div>
      </div>

      {/* Template info */}
      {template && (
        <Card className="glass border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">{template.name}</h4>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form validation errors */}
      {Object.keys(formErrors).length > 0 && (
        <Card className="glass border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Please fix the following errors:</h4>
                <ul className="mt-2 text-sm text-destructive space-y-1">
                  {Object.entries(formErrors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {template ? (
          /* Template-based form */
          <Card className="glass border-glass-border">
            <CardContent className="space-y-4 pt-4">
              {((template as any).questions || (template as any).fields || []).map((field: TemplateField) => renderTemplateField(field))}
            </CardContent>
          </Card>
        ) : (
          /* Default form */
          <>
            {/* Basic Information */}
            <Card className="glass border-glass-border">
              <CardHeader>
                <CardTitle className="font-heading">Basic Information</CardTitle>
                <CardDescription>Essential details about your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    Report Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={defaultFormData.title}
                    onChange={(e) => {
                      setDefaultFormData((prev) => ({ ...prev, title: e.target.value }))
                      if (formErrors.title) {
                        setFormErrors((prev) => ({ ...prev, title: "" }))
                      }
                    }}
                    placeholder="Brief summary of the issue or topic"
                    className={formErrors.title ? "border-destructive" : ""}
                    required
                  />
                  {formErrors.title && <p className="text-sm text-destructive mt-1">{formErrors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={defaultFormData.description}
                    onChange={(e) => {
                      setDefaultFormData((prev) => ({ ...prev, description: e.target.value }))
                      if (formErrors.description) {
                        setFormErrors((prev) => ({ ...prev, description: "" }))
                      }
                    }}
                    placeholder="Detailed description of the issue, request, or feedback"
                    rows={4}
                    className={formErrors.description ? "border-destructive" : ""}
                    required
                  />
                  {formErrors.description && <p className="text-sm text-destructive mt-1">{formErrors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={defaultFormData.category}
                    onValueChange={(value) => {
                      setDefaultFormData((prev) => ({ ...prev, category: value }))
                      if (formErrors.category) {
                        setFormErrors((prev) => ({ ...prev, category: "" }))
                      }
                    }}
                  >
                    <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category && <p className="text-sm text-destructive mt-1">{formErrors.category}</p>}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
