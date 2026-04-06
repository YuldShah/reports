"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, FileText, Trash2, Upload, Eye, FileJson, Copy, Check, Users, Pencil, ChevronDown } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuthContext } from "@/components/auth-provider"
import { normalizeText } from "@/lib/utils"
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

interface Template {
  id: string
  name: string
  description?: string
  questions: any[]
  isStudentTracker: boolean
  createdAt: Date
  createdBy: number | null
}

// Predefined student tracker template questions in Uzbek
const STUDENT_TRACKER_QUESTIONS = [
  { id: "course_1", label: "1-kurs (Freshman)", type: "number", required: true, placeholder: "0" },
  { id: "course_2", label: "2-kurs (Sophomore)", type: "number", required: true, placeholder: "0" },
  { id: "course_3", label: "3-kurs (Junior)", type: "number", required: true, placeholder: "0" },
  { id: "course_4", label: "4-kurs (Senior)", type: "number", required: true, placeholder: "0" },
  { id: "masters", label: "Magistratura", type: "number", required: true, placeholder: "0" },
]

interface TemplateManagementProps {
  onDataChange?: () => void
}

export default function TemplateManagement({ onDataChange }: TemplateManagementProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", questions: "[]", isStudentTracker: false })
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedTemplate, setEditedTemplate] = useState({ name: "", description: "", questions: "", isStudentTracker: false })
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { telegramUser, dbUser } = useAuthContext()
  const [showJsonSection, setShowJsonSection] = useState(false)

  const handleBackFromView = () => {
    setViewingTemplate(false)
    setSelectedTemplate(null)
    setIsEditMode(false)
    setJsonError(null)
    setShowJsonSection(false)
  }

  useTelegramBackButton(viewingTemplate, handleBackFromView)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()

      const templatesWithDates = (data.templates || []).map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt)
      }))

      setTemplates(templatesWithDates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const validateQuestions = (questionsJson: string): { valid: boolean; questions?: any[]; error?: string } => {
    try {
      const questions = JSON.parse(questionsJson)

      if (!Array.isArray(questions)) {
        return { valid: false, error: "Questions must be an array" }
      }

      if (questions.length === 0) {
        return { valid: false, error: "At least one question is required" }
      }

      // Validate each question has required fields
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        if (!q.id) {
          return { valid: false, error: `Question ${i + 1}: Missing required field 'id'` }
        }
        if (!q.label) {
          return { valid: false, error: `Question ${i + 1}: Missing required field 'label'` }
        }
        if (!q.type) {
          return { valid: false, error: `Question ${i + 1}: Missing required field 'type'` }
        }
        // Valid types
        const validTypes = ['text', 'textarea', 'number', 'email', 'tel', 'date', 'select', 'radio', 'checkbox', 'photo', 'file']
        if (!validTypes.includes(q.type)) {
          return { valid: false, error: `Question ${i + 1}: Invalid type '${q.type}'. Must be one of: ${validTypes.join(', ')}` }
        }
        // If type is select, radio, or checkbox, options are required
        if (['select', 'radio', 'checkbox'].includes(q.type) && (!q.options || !Array.isArray(q.options) || q.options.length === 0)) {
          return { valid: false, error: `Question ${i + 1}: Field 'options' array is required for type '${q.type}'` }
        }
      }

      return { valid: true, questions }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : "Invalid JSON syntax" }
    }
  }

  const handleCreateTemplate = async () => {
    const actingAdminId = dbUser?.telegramId ?? telegramUser?.id

    if (!newTemplate.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const validation = validateQuestions(newTemplate.questions)
    if (!validation.valid) {
      setJsonError(validation.error || null)
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    const questions = validation.questions

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTemplate.name,
          description: newTemplate.description,
          questions,
          isStudentTracker: newTemplate.isStudentTracker,
          createdBy: actingAdminId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      const data = await response.json()
      setTemplates([...templates, { ...data.template, createdAt: new Date(data.template.createdAt) }])
      setNewTemplate({ name: "", description: "", questions: "[]", isStudentTracker: false })
      setJsonError(null)
      setIsCreateDialogOpen(false)

      toast({
        title: "Success",
        description: "Template created successfully",
        duration: 3000,
      })

      onDataChange?.()
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)

        // Validate the JSON structure
        if (!json.name || !json.questions || !Array.isArray(json.questions)) {
          throw new Error("Invalid template format. Must include 'name' and 'questions' array.")
        }

        setNewTemplate({
          name: json.name || "",
          description: json.description || "",
          questions: JSON.stringify(json.questions, null, 2),
          isStudentTracker: json.isStudentTracker || false
        })

        toast({
          title: "Success",
          description: "Template JSON loaded successfully",
          duration: 3000,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Invalid JSON file",
          variant: "destructive",
          duration: 3000,
        })
      }
    }
    reader.readAsText(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    if (!editedTemplate.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const validation = validateQuestions(editedTemplate.questions)
    if (!validation.valid) {
      setJsonError(validation.error || null)
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    const questions = validation.questions

    try {
      const response = await fetch('/api/templates', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedTemplate.id,
          name: editedTemplate.name,
          description: editedTemplate.description,
          questions,
          isStudentTracker: editedTemplate.isStudentTracker,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update template')
      }

      const data = await response.json()
      setTemplates(templates.map(t =>
        t.id === selectedTemplate.id
          ? { ...data.template, createdAt: new Date(data.template.createdAt) }
          : t
      ))

      setJsonError(null)
      setIsEditMode(false)
      setViewingTemplate(false)
      setSelectedTemplate(null)

      toast({
        title: "Success",
        description: "Template updated successfully",
        duration: 3000,
      })

      onDataChange?.()
    } catch (error) {
      console.error('Error updating template:', error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      const response = await fetch(`/api/templates?id=${templateToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      setTemplates(templates.filter(t => t.id !== templateToDelete.id))
      setIsDeleteDialogOpen(false)
      setTemplateToDelete(null)

      toast({
        title: "Success",
        description: "Template deleted successfully",
        duration: 3000,
      })

      onDataChange?.()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Template Management</h2>
            <p className="text-sm text-muted-foreground">Create, view, and delete report templates</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  // Template detail/preview page
  if (viewingTemplate && selectedTemplate) {
    const renderFormPreview = () => {
      const questions = selectedTemplate.questions || []
      if (questions.length === 0) {
        return <p className="text-sm text-muted-foreground py-4 text-center">No fields defined</p>
      }

      return (
        <div className="space-y-5">
          {questions.map((field: any, idx: number) => (
            <div key={field.id || idx} className="space-y-2">
              <Label className="text-sm font-medium">
                {normalizeText(field.label || field.question || field.id)}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea disabled placeholder={field.placeholder || ''} rows={3} className="opacity-60" />
              ) : field.type === 'select' ? (
                <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm opacity-60">
                  <span className="text-muted-foreground">{field.placeholder || 'Select an option...'}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : field.type === 'radio' ? (
                <RadioGroup disabled className="opacity-60">
                  {(field.options || []).map((opt: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`preview-${field.id}-${i}`} />
                      <Label htmlFor={`preview-${field.id}-${i}`} className="font-normal text-sm">
                        {normalizeText(opt)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : field.type === 'checkbox' ? (
                <div className="space-y-2 opacity-60">
                  {(field.options || []).map((opt: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox id={`preview-${field.id}-${i}`} disabled />
                      <Label htmlFor={`preview-${field.id}-${i}`} className="font-normal text-sm">
                        {normalizeText(opt)}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : field.type === 'date' ? (
                <Input type="date" disabled className="opacity-60" />
              ) : field.type === 'photo' || field.type === 'file' ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center opacity-60">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {field.type === 'photo' ? 'Photo upload' : 'File upload'}
                  </p>
                </div>
              ) : (
                <Input
                  type={field.type || 'text'}
                  disabled
                  placeholder={field.placeholder || ''}
                  className="opacity-60"
                />
              )}
            </div>
          ))}
        </div>
      )
    }

    // Edit mode page
    if (isEditMode) {
      return (
        <div className="space-y-4">
          <Card className="glass border-glass-border">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div>
                <Label htmlFor="edit-template-name">Template Name*</Label>
                <Input
                  id="edit-template-name"
                  value={editedTemplate.name}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-template-description">Description</Label>
                <Textarea
                  id="edit-template-description"
                  value={editedTemplate.description}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="edit-student-tracker" className="font-medium">Talaba taqsimoti tracker</Label>
                    <p className="text-xs text-muted-foreground">Tutorlar uchun talaba taqsimoti formasi</p>
                  </div>
                </div>
                <Switch
                  id="edit-student-tracker"
                  checked={editedTemplate.isStudentTracker}
                  onCheckedChange={(checked) => {
                    setEditedTemplate({
                      ...editedTemplate,
                      isStudentTracker: checked,
                      questions: checked ? JSON.stringify(STUDENT_TRACKER_QUESTIONS, null, 2) : editedTemplate.questions
                    })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit-template-questions">Questions (JSON Array)*</Label>
                <Textarea
                  id="edit-template-questions"
                  value={editedTemplate.questions}
                  onChange={(e) => {
                    setEditedTemplate({ ...editedTemplate, questions: e.target.value })
                    setJsonError(null)
                  }}
                  rows={15}
                  className={`font-mono text-sm ${jsonError ? 'border-destructive' : ''}`}
                />
                {jsonError && <p className="text-xs text-destructive mt-1">{jsonError}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Valid types: text, textarea, number, email, tel, date, select, radio, checkbox, file, photo
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateTemplate} className="flex-1">Save Changes</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false)
                    setJsonError(null)
                    setEditedTemplate({
                      name: selectedTemplate.name,
                      description: selectedTemplate.description || "",
                      questions: JSON.stringify(selectedTemplate.questions, null, 2),
                      isStudentTracker: selectedTemplate.isStudentTracker || false
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // View mode page
    return (
      <div className="space-y-4">
        {/* Template header */}
        <Card className="glass border-glass-border">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="font-heading text-xl font-semibold tracking-tight">
                  {normalizeText(selectedTemplate.name)}
                </h1>
                {selectedTemplate.description && (
                  <p className="text-sm text-muted-foreground mt-1">{normalizeText(selectedTemplate.description)}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditMode(true)}
                className="shrink-0 ml-3"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{selectedTemplate.questions.length} fields</Badge>
              {selectedTemplate.isStudentTracker && (
                <Badge variant="default" className="bg-blue-500">
                  <Users className="w-3 h-3 mr-1" />
                  Talaba Tracker
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Created {selectedTemplate.createdAt.toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form preview */}
        <Card className="glass border-glass-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Form Preview
            </CardTitle>
            <CardDescription>How this template appears when filling out a report</CardDescription>
          </CardHeader>
          <CardContent>
            {renderFormPreview()}
          </CardContent>
        </Card>

        {/* JSON section (collapsible) */}
        <Card className="glass border-glass-border">
          <button
            onClick={() => setShowJsonSection(!showJsonSection)}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Questions JSON</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showJsonSection ? 'rotate-180' : ''}`} />
          </button>
          {showJsonSection && (
            <CardContent className="pt-0">
              <div className="bg-muted/30 rounded-lg overflow-hidden border border-border">
                <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">JSON</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => {
                      const jsonContent = JSON.stringify(selectedTemplate.questions, null, 2)
                      navigator.clipboard.writeText(jsonContent)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                      toast({ title: "Copied!", description: "JSON copied to clipboard", duration: 2000 })
                    }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-sm text-foreground font-mono leading-relaxed">
                    <code>{JSON.stringify(selectedTemplate.questions, null, 2).split('\n').map((line, index) => (
                      <div key={index} className="flex">
                        <span className="text-muted-foreground select-none text-right pr-4 w-8 shrink-0 inline-block">{index + 1}</span>
                        <span className="whitespace-pre-wrap break-all flex-1">{line}</span>
                      </div>
                    ))}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => setIsEditMode(true)} className="flex-1">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Template
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              setTemplateToDelete(selectedTemplate)
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Template Management</h2>
          <p className="text-sm text-muted-foreground">Create, view, and delete report templates</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>Create a template manually or upload a JSON file</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload JSON File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <Label htmlFor="template-name">Template Name*</Label>
                <Input
                  id="template-name"
                  placeholder="Enter template name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description (Optional)</Label>
                <Textarea
                  id="template-description"
                  placeholder="Enter template description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="student-tracker" className="font-medium">Talaba taqsimoti tracker</Label>
                    <p className="text-xs text-muted-foreground">Tutorlar uchun talaba taqsimoti formasi</p>
                  </div>
                </div>
                <Switch
                  id="student-tracker"
                  checked={newTemplate.isStudentTracker}
                  onCheckedChange={(checked) => {
                    setNewTemplate({
                      ...newTemplate,
                      isStudentTracker: checked,
                      name: checked && !newTemplate.name ? "Talaba Taqsimoti" : newTemplate.name,
                      description: checked && !newTemplate.description ? "Sizga qancha talaba taqsimlangani haqida ma'lumot" : newTemplate.description,
                      questions: checked ? JSON.stringify(STUDENT_TRACKER_QUESTIONS, null, 2) : newTemplate.questions
                    })
                  }}
                />
              </div>


              <div>
                <Label htmlFor="template-questions">Questions (JSON Array)*</Label>
                <Textarea
                  id="template-questions"
                  placeholder={`[\n  {\n    "id": "field1",\n    "label": "Question 1",\n    "type": "text",\n    "required": true,\n    "placeholder": "Enter text..."\n  },\n  {\n    "id": "field2",\n    "label": "Question 2",\n    "type": "select",\n    "required": true,\n    "options": ["Option 1", "Option 2"]\n  }\n]`}
                  value={newTemplate.questions}
                  onChange={(e) => {
                    setNewTemplate({ ...newTemplate, questions: e.target.value })
                    setJsonError(null)
                  }}
                  rows={12}
                  className={`font-mono text-sm ${jsonError ? 'border-destructive' : ''}`}
                />
                {jsonError && (
                  <p className="text-xs text-destructive mt-1">{jsonError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Valid types: text, textarea, number, email, tel, date, select, radio, checkbox, file, photo. Fields with options (select/radio/checkbox) require an &quot;options&quot; array.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTemplate} className="flex-1">
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="relative glass border-glass-border card-interactive">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-heading text-lg truncate">{normalizeText(template.name)}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {normalizeText(template.description) || "No description provided"}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Questions:</span>
                <div className="flex gap-2">
                  {template.isStudentTracker && (
                    <Badge variant="default" className="bg-blue-500">
                      <Users className="w-3 h-3 mr-1" />
                      Talaba Tracker
                    </Badge>
                  )}
                  <Badge variant="secondary">{template.questions.length} fields</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setEditedTemplate({
                      name: template.name,
                      description: template.description || "",
                      questions: JSON.stringify(template.questions, null, 2),
                      isStudentTracker: template.isStudentTracker || false
                    })
                    setIsEditMode(false)
                    setJsonError(null)
                    setShowJsonSection(false)
                    setViewingTemplate(true)
                  }}
                  className="flex-1"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTemplateToDelete(template)
                    setIsDeleteDialogOpen(true)
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Created {template.createdAt.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="glass border-glass-border">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium mb-2">No templates created yet</h3>
            <p className="text-muted-foreground mb-4">Create your first template to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{normalizeText(templateToDelete?.name)}&quot;? This action cannot be undone.
              Existing reports using this template will keep their data, but new reports cannot use this template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                handleDeleteTemplate()
              }}
            >
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
