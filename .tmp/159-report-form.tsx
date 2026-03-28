"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Send, AlertCircle, FileText, Loader2, ImagePlus, X, Expand } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { User, Team, ReportTemplate, TemplateField } from "@/lib/types"
import { normalizeText } from "@/lib/utils"

interface ReportFormProps {
  user: User
  templateId?: string | null
  onCancel: () => void
  onSuccess: () => void
}

const MAX_PHOTOS_PER_FIELD = 5

export default function ReportForm({ user, templateId, onCancel, onSuccess }: ReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [team, setTeam] = useState<Team | null>(null)
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [uploadingPhotoFields, setUploadingPhotoFields] = useState<Record<string, boolean>>({})
  const [draggingPhotoField, setDraggingPhotoField] = useState<string | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
              if (field.type === 'photo') {
                initialFormData[field.id] = []
              } else {
                initialFormData[field.id] = ''
              }
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

  useEffect(() => {
    if (!previewPhotoUrl) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewPhotoUrl(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewPhotoUrl])

  const normalizePhotoValue = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string" && item.trim().length > 0)
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return [value]
    }

    return []
  }

  const setFieldValue = (fieldId: string, nextValue: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: nextValue,
    }))

    setFormErrors((prev) => {
      if (!prev[fieldId]) {
        return prev
      }

      const nextErrors = { ...prev }
      delete nextErrors[fieldId]
      return nextErrors
    })
  }

  const uploadPhotoFiles = async (fieldId: string, files: File[]) => {
    if (!files.length) {
      return
    }

    const currentUrls = normalizePhotoValue(formData[fieldId])
    const remainingSlots = MAX_PHOTOS_PER_FIELD - currentUrls.length

    if (remainingSlots <= 0) {
      toast({
        title: "Photo limit reached",
        description: `You can upload up to ${MAX_PHOTOS_PER_FIELD} photos for this field.`,
        variant: "destructive",
      })
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)

    if (filesToUpload.length < files.length) {
      toast({
        title: "Upload limit applied",
        description: `Only the first ${remainingSlots} photo(s) were uploaded.`,
      })
    }

    setUploadingPhotoFields((prev) => ({ ...prev, [fieldId]: true }))

    try {
      const payload = new FormData()
      filesToUpload.forEach((file) => payload.append("files", file))

      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: payload,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload request failed")
      }

      const uploadResult = await uploadResponse.json()
      const uploadedUrls = Array.isArray(uploadResult.urls)
        ? uploadResult.urls.filter((url: unknown) => typeof url === "string" && url.trim().length > 0)
        : []

      if (!uploadedUrls.length) {
        throw new Error("No uploaded URLs returned")
      }

      setFieldValue(fieldId, [...currentUrls, ...uploadedUrls].slice(0, MAX_PHOTOS_PER_FIELD))
    } catch (error) {
      console.error("Photo upload failed:", error)
      toast({
        title: "Upload failed",
        description: "Could not upload photos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingPhotoFields((prev) => ({ ...prev, [fieldId]: false }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (template) {
      // Validate template fields (support both 'questions' and 'fields' for compatibility)
      const fields = (template as any).questions || (template as any).fields || []
      fields.forEach((field: TemplateField) => {
        if (field.required) {
          const value = formData[field.id]
          const isMissingValue =
            value === undefined ||
            value === null ||
            (typeof value === 'string' && !value.trim()) ||
            (Array.isArray(value) && value.length === 0)

          if (isMissingValue) {
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
      
      // Scroll to top to see errors
      window.scrollTo({ top: 0, behavior: "smooth" })
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

  const renderTemplateField = (field: TemplateField, index: number) => {
    const value = formData[field.id] || ''
    const hasError = !!formErrors[field.id]
    const fieldLabel = normalizeText(field.label || field.id)
    const fieldPlaceholder = normalizeText(field.placeholder)
    const isUploadingPhotos = !!uploadingPhotoFields[field.id]
    const photoUrls = normalizePhotoValue(value)

    const handleFieldChange = (newValue: any) => {
      setFieldValue(field.id, newValue)
    }

    return (
      <motion.div 
        key={field.id} 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="space-y-2"
      >
        <Label htmlFor={field.id} className={hasError ? "text-destructive" : ""}>
          {fieldLabel}
        </Label>
        
        {field.type === 'text' && (
          <Input
            id={field.id}
            placeholder={fieldPlaceholder}
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={hasError ? "border-destructive focus-visible:ring-destructive" : "transition-all focus:border-primary"}
          />
        )}
        
        {field.type === 'textarea' && (
          <Textarea
            id={field.id}
            placeholder={fieldPlaceholder}
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            className={hasError ? "border-destructive focus-visible:ring-destructive" : "transition-all focus:border-primary"}
            rows={3}
          />
        )}
        
        {field.type === 'number' && (
          <Input
            id={field.id}
            type="text"
            inputMode="numeric"
            placeholder={fieldPlaceholder}
            value={value}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
                handleFieldChange(raw)
              }
            }}
            className={hasError ? "border-destructive focus-visible:ring-destructive" : "transition-all focus:border-primary"}
          />
        )}
        
        {field.type === 'date' && (
          <DatePicker
            value={value}
            onChange={handleFieldChange}
            placeholder={fieldPlaceholder || "Sanani tanlang"}
            hasError={hasError}
          />
        )}

        {field.type === 'select' && Array.isArray(field.options) && field.options.length > 0 && (
          <Select value={value} onValueChange={handleFieldChange}>
            <SelectTrigger id={field.id} className={hasError ? "border-destructive focus-visible:ring-destructive" : "transition-all focus:border-primary"}>
              <SelectValue placeholder={fieldPlaceholder || "Tanlang"} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {normalizeText(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'photo' && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>5 tagacha rasm yuklang. Hajm bo'yicha cheklov qo'yilmagan.</span>
              <span>{photoUrls.length}/{MAX_PHOTOS_PER_FIELD}</span>
            </div>

            <input
              ref={(node) => {
                photoInputRefs.current[field.id] = node
              }}
              id={`${field.id}_photo_input`}
              type="file"
              accept="image/*"
              multiple
              disabled={isUploadingPhotos || photoUrls.length >= MAX_PHOTOS_PER_FIELD}
              className="hidden"
              onChange={async (event) => {
                const selectedFiles = Array.from(event.target.files ?? [])
                event.currentTarget.value = ''
                await uploadPhotoFiles(field.id, selectedFiles)
              }}
            />

            <div
              className={`rounded-xl border-2 border-dashed p-5 transition-all ${draggingPhotoField === field.id ? "border-primary bg-primary/5" : hasError ? "border-destructive/60" : "border-border/70"}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDraggingPhotoField(field.id)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                if (draggingPhotoField === field.id) {
                  setDraggingPhotoField(null)
                }
              }}
              onDrop={async (event) => {
                event.preventDefault()
                setDraggingPhotoField(null)
                const droppedFiles = Array.from(event.dataTransfer.files ?? [])
                await uploadPhotoFiles(field.id, droppedFiles)
              }}
            >
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Drag and drop photos here or
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploadingPhotos || photoUrls.length >= MAX_PHOTOS_PER_FIELD}
                  onClick={() => photoInputRefs.current[field.id]?.click()}
                >
                  Choose photos
                </Button>
              </div>
            </div>

            {isUploadingPhotos && (
              <div className="inline-flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading photos...
              </div>
            )}

            {photoUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photoUrls.map((photoUrl: string, photoIndex: number) => (
                  <div key={`${photoUrl}-${photoIndex}`} className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt={`Uploaded photo ${photoIndex + 1}`}
                      className="h-full w-full cursor-zoom-in object-cover transition-transform duration-200 group-hover:scale-105"
                      onClick={() => setPreviewPhotoUrl(photoUrl)}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-1.5 top-1.5 z-10 h-6 w-6 rounded-full p-0"
                      onClick={() => {
                        const remaining = photoUrls.filter((_, indexValue) => indexValue !== photoIndex)
                        handleFieldChange(remaining)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>

                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(photoUrl)}
                      className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Expand className="h-3 w-3" />
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <AnimatePresence>
          {hasError && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-destructive flex items-center gap-1 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4" />
              {formErrors[field.id]}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Loading...</h1>
          <p className="text-sm text-muted-foreground">Preparing report form</p>
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
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Submit Report</h1>
          <p className="text-sm text-muted-foreground">
            {template ? `Using ${normalizeText(template.name)} template` : "Fill out the form below to submit your report"}
          </p>
        </div>
      </motion.div>

      {/* Template info */}
      <AnimatePresence>
        {template && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="surface-panel border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{normalizeText(template.name)}</h4>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{normalizeText(template.description)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form validation errors */}
      <AnimatePresence>
        {Object.keys(formErrors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="surface-panel border-destructive/50 bg-destructive/5 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
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
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {template ? (
          /* Template-based form */
          <Card className="surface-panel border-glass-border">
            <CardContent className="space-y-5 pt-6 pb-6">
              {((template as any).questions || (template as any).fields || []).map((field: TemplateField, index: number) => renderTemplateField(field, index))}
            </CardContent>
          </Card>
        ) : (
          /* Default form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="surface-panel border-glass-border">
              <CardHeader>
                <CardTitle className="font-heading">Basic Information</CardTitle>
                <CardDescription>Essential details about your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Report Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={defaultFormData.title}
                    onChange={(e) => {
                      setDefaultFormData((prev) => ({ ...prev, title: e.target.value }))
                      if (formErrors.title) {
                        setFormErrors((prev) => {
                          const newErrors = {...prev}
                          delete newErrors.title
                          return newErrors
                        })
                      }
                    }}
                    placeholder="Brief summary of the issue or topic"
                    className={`transition-all ${formErrors.title ? "border-destructive focus-visible:ring-destructive" : "focus:border-primary"}`}
                  />
                  <AnimatePresence>
                    {formErrors.title && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-destructive mt-1 flex items-center gap-1 overflow-hidden"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formErrors.title}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={defaultFormData.description}
                    onChange={(e) => {
                      setDefaultFormData((prev) => ({ ...prev, description: e.target.value }))
                      if (formErrors.description) {
                        setFormErrors((prev) => {
                          const newErrors = {...prev}
                          delete newErrors.description
                          return newErrors
                        })
                      }
                    }}
                    placeholder="Detailed description of the issue, request, or feedback"
                    rows={4}
                    className={`transition-all ${formErrors.description ? "border-destructive focus-visible:ring-destructive" : "focus:border-primary"}`}
                  />
                  <AnimatePresence>
                    {formErrors.description && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-destructive mt-1 flex items-center gap-1 overflow-hidden"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formErrors.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={defaultFormData.category}
                    onValueChange={(value) => {
                      setDefaultFormData((prev) => ({ ...prev, category: value }))
                      if (formErrors.category) {
                        setFormErrors((prev) => {
                          const newErrors = {...prev}
                          delete newErrors.category
                          return newErrors
                        })
                      }
                    }}
                  >
                    <SelectTrigger className={`transition-all ${formErrors.category ? "border-destructive focus-visible:ring-destructive" : "focus:border-primary"}`}>
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
                  <AnimatePresence>
                    {formErrors.category && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-destructive mt-1 flex items-center gap-1 overflow-hidden"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formErrors.category}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div 
          className="flex gap-4 pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="transition-transform active:scale-95 flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 shadow-md">
            {isSubmitting ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </motion.div>
            )}
          </Button>
        </motion.div>
      </form>

      <AnimatePresence>
        {previewPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewPhotoUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={() => setPreviewPhotoUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhotoUrl}
                alt="Photo preview"
                className="max-h-[85vh] w-full rounded-xl object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
