"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Send, AlertCircle, FileText, Loader2, ImagePlus, X } from "lucide-react"
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
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const MAX_FILE_SIZE_MB = 50

const ACCEPTED_UPLOAD_EXTENSIONS = [".docx", ".pdf", ".jpeg", ".jpg", ".png", ".heic", ".heif"]
const ACCEPTED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
])
const FILE_INPUT_ACCEPT = ".docx,.pdf,.jpeg,.jpg,.png,.heic,.heif"

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".")
  if (dotIndex < 0) {
    return ""
  }
  return fileName.slice(dotIndex).toLowerCase()
}

const isAllowedUploadFile = (file: File) => {
  const mime = (file.type || "").toLowerCase()
  const extension = getFileExtension(file.name || "")

  if (ACCEPTED_UPLOAD_MIME_TYPES.has(mime)) {
    return true
  }

  return ACCEPTED_UPLOAD_EXTENSIONS.includes(extension)
}

const isImageFileUrl = (value: string) => {
  if (!value) {
    return false
  }

  const normalized = value.split("?")[0].toLowerCase()
  return normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") || normalized.endsWith(".png") || normalized.endsWith(".heic") || normalized.endsWith(".heif")
}

const getFileNameFromUrl = (fileUrl: string) => {
  try {
    const pathname = new URL(fileUrl).pathname
    const name = pathname.split("/").pop() || fileUrl
    return decodeURIComponent(name)
  } catch {
    const name = fileUrl.split("/").pop() || fileUrl
    return decodeURIComponent(name)
  }
}

export default function ReportForm({ user, templateId, onCancel, onSuccess }: ReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [team, setTeam] = useState<Team | null>(null)
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [uploadingPhotoFields, setUploadingPhotoFields] = useState<Record<string, number>>({})
  const [draggingPhotoField, setDraggingPhotoField] = useState<string | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
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
              if (field.type === 'photo' || field.type === 'file') {
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
    setIsMounted(true)

    return () => {
      setIsMounted(false)
    }
  }, [])

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

  const normalizeFileValue = (value: unknown): string[] => {
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

    const currentUrls = normalizeFileValue(formData[fieldId])
    const remainingSlots = MAX_PHOTOS_PER_FIELD - currentUrls.length

    if (remainingSlots <= 0) {
      toast({
        title: "File limit reached",
        description: `You can upload up to ${MAX_PHOTOS_PER_FIELD} files for this field.`,
        variant: "destructive",
      })
      return
    }

    const allowedFiles = files.filter((file) => isAllowedUploadFile(file))
    const oversizedFiles = allowedFiles.filter((file) => file.size > MAX_FILE_SIZE_BYTES)

    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Each file must be at most ${MAX_FILE_SIZE_MB}MB.`,
        variant: "destructive",
      })
      return
    }

    if (allowedFiles.length < files.length) {
      toast({
        title: "Unsupported file skipped",
        description: "Only .docx, .pdf, .jpeg/.jpg, .png, .heic, and .heif are allowed.",
      })
    }

    const filesToUpload = allowedFiles.slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      return
    }

    if (filesToUpload.length < files.length) {
      toast({
        title: "Upload limit applied",
        description: `Only the first ${remainingSlots} file(s) were uploaded.`,
      })
    }

    setUploadingPhotoFields((prev) => ({ ...prev, [fieldId]: filesToUpload.length }))

    try {
      const payload = new FormData()
      filesToUpload.forEach((file) => payload.append("files", file))

      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: payload,
      })

      if (!uploadResponse.ok) {
        const errorPayload = await uploadResponse.json().catch(() => null)
        throw new Error(typeof errorPayload?.error === "string" ? errorPayload.error : "Upload request failed")
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
      console.error("File upload failed:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingPhotoFields((prev) => ({ ...prev, [fieldId]: 0 }))
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
    const uploadingCount = uploadingPhotoFields[field.id] || 0
    const isUploadingPhotos = uploadingCount > 0
    const photoUrls = normalizeFileValue(value)

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
              {field.options.map((option, optionIndex) => {
                const optionValue = typeof option === "string" ? option : option.value
                const optionLabel = typeof option === "string" ? option : option.label

                return (
                  <SelectItem key={`${optionValue}_${optionIndex}`} value={optionValue}>
                    {normalizeText(optionLabel)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}

        {(field.type === 'photo' || field.type === 'file') && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>5 tagacha, {MAX_FILE_SIZE_MB}MB/file</span>
              <span>{photoUrls.length}/{MAX_PHOTOS_PER_FIELD}</span>
            </div>

            <input
              ref={(node) => {
                photoInputRefs.current[field.id] = node
              }}
              id={`${field.id}_photo_input`}
              type="file"
              accept={FILE_INPUT_ACCEPT}
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
                  Drag and drop files here or
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploadingPhotos || photoUrls.length >= MAX_PHOTOS_PER_FIELD}
                  onClick={() => photoInputRefs.current[field.id]?.click()}
                >
                  Choose files
                </Button>
              </div>
            </div>

            {(photoUrls.length > 0 || isUploadingPhotos) && (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                {photoUrls.map((photoUrl: string, photoIndex: number) => (
                  <div key={`${photoUrl}-${photoIndex}`} className="relative shrink-0 h-20 w-20">
                    {isImageFileUrl(photoUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={`Uploaded file ${photoIndex + 1}`}
                        className="h-20 w-20 cursor-zoom-in rounded-lg object-cover"
                        onClick={() => setPreviewPhotoUrl(photoUrl)}
                      />
                    ) : (
                      <a
                        href={photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg bg-muted text-muted-foreground"
                      >
                        <FileText className="h-6 w-6" />
                        <span className="w-16 truncate text-center text-[10px] leading-tight">{getFileNameFromUrl(photoUrl).split('.').pop()?.toUpperCase()}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                      onClick={() => {
                        const remaining = photoUrls.filter((_, indexValue) => indexValue !== photoIndex)
                        handleFieldChange(remaining)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {isUploadingPhotos && Array.from({ length: uploadingCount }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="shrink-0 h-20 w-20 rounded-lg bg-muted/50 animate-pulse flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
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
                className="flex items-center gap-1"
              >
                <span>Submitting</span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="inline-block h-1 w-1 rounded-full bg-current"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </span>
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

      {isMounted
        ? createPortal(
            <AnimatePresence>
              {previewPhotoUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4"
                  onClick={() => setPreviewPhotoUrl(null)}
                >
                  <button
                    type="button"
                    className="absolute z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                    style={{ top: "calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 12px)", right: "16px" }}
                    onClick={() => setPreviewPhotoUrl(null)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <motion.img
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    src={previewPhotoUrl}
                    alt="Photo preview"
                    className="max-h-[85vh] max-w-full rounded-xl object-contain"
                    onClick={(event) => event.stopPropagation()}
                  />
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  )
}
