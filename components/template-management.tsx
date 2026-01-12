"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, FileText, Trash2, Upload, Eye, FileJson, Copy, Check, GraduationCap } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuthContext } from "@/components/auth-provider"
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

interface TemplateManagementProps {
  onDataChange?: () => void
}

export default function TemplateManagement({ onDataChange }: TemplateManagementProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", questions: "[]", isStudentTracker: false })
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedTemplate, setEditedTemplate] = useState({ name: "", description: "", questions: "", isStudentTracker: false })
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { telegramUser, dbUser } = useAuthContext()

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
        const validTypes = ['text', 'textarea', 'number', 'email', 'tel', 'date', 'select', 'radio', 'checkbox']
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
          createdBy: actingAdminId,
          isStudentTracker: newTemplate.isStudentTracker,
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
      setIsViewDialogOpen(false)
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold">Template Management</h2>
            <p className="text-sm text-muted-foreground">Create, view, and delete report templates</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold">Template Management</h2>
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
                  Valid types: text, textarea, number, email, tel, date, select, radio, checkbox. Fields with options (select/radio/checkbox) require an &quot;options&quot; array.
                </p>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="student-tracker"
                  checked={newTemplate.isStudentTracker}
                  onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isStudentTracker: checked === true })}
                />
                <Label htmlFor="student-tracker" className="flex items-center gap-2 cursor-pointer">
                  <GraduationCap className="w-4 h-4" />
                  Talaba taqsimoti (Student Tracker)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTemplate} className="flex-1">
                  Create Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewTemplate({ name: "", description: "", questions: "[]", isStudentTracker: false })
                    setJsonError(null)
                    setIsCreateDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || "No description provided"}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                <span className="text-muted-foreground">Questions:</span>
                <div className="flex gap-2">
                  {template.isStudentTracker && (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Talaba
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
                      isStudentTracker: template.isStudentTracker
                    })
                    setIsEditMode(false)
                    setJsonError(null)
                    setIsViewDialogOpen(true)
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
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates created yet</h3>
            <p className="text-muted-foreground mb-4">Create your first template to get started</p>
          </CardContent>
        </Card>
      )}

      {/* View/Edit Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open)
        if (!open) {
          setIsEditMode(false)
          setJsonError(null)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Template' : selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update template details and questions' : selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              {isEditMode ? (
                <>
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
                    {jsonError && (
                      <p className="text-xs text-destructive mt-1">{jsonError}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Valid types: text, textarea, number, email, tel, date, select, radio, checkbox
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id="edit-student-tracker"
                      checked={editedTemplate.isStudentTracker}
                      onCheckedChange={(checked) => setEditedTemplate({ ...editedTemplate, isStudentTracker: checked === true })}
                    />
                    <Label htmlFor="edit-student-tracker" className="flex items-center gap-2 cursor-pointer">
                      <GraduationCap className="w-4 h-4" />
                      Talaba taqsimoti (Student Tracker)
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleUpdateTemplate} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false)
                        setJsonError(null)
                        setEditedTemplate({
                          name: selectedTemplate.name,
                          description: selectedTemplate.description || "",
                          questions: JSON.stringify(selectedTemplate.questions, null, 2),
                          isStudentTracker: selectedTemplate.isStudentTracker
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      {selectedTemplate.isStudentTracker && (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          Talaba taqsimoti
                        </Badge>
                      )}
                      <Badge variant="secondary">{selectedTemplate.questions.length} fields</Badge>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Questions JSON</h4>
                        <Badge variant="secondary" className="text-xs">Read-only</Badge>
                      </div>
                      <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileJson className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-400">JSON</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                            onClick={() => {
                              const jsonContent = JSON.stringify(selectedTemplate.questions, null, 2)
                              navigator.clipboard.writeText(jsonContent)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                              toast({
                                title: "Copied!",
                                description: "JSON copied to clipboard",
                                duration: 2000,
                              })
                            }}
                          >
                            {copied ? (
                              <Check className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 mr-1" />
                            )}
                            <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                          </Button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[50vh]">
                          <pre className="text-sm text-slate-100 font-mono leading-relaxed">
                            <code>{JSON.stringify(selectedTemplate.questions, null, 2).split('\n').map((line, index) => (
                              <div key={index} className="flex">
                                <span className="text-slate-500 select-none text-right pr-4 w-8 shrink-0 inline-block">{index + 1}</span>
                                <span className="whitespace-pre-wrap break-all flex-1">{line}</span>
                              </div>
                            ))}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setIsEditMode(true)} className="flex-1">
                      Edit Template
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsViewDialogOpen(false)
                        setSelectedTemplate(null)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
              Existing reports using this template will keep their data, but new reports cannot use this template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setTemplateToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDeleteTemplate()
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
