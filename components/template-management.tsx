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
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, FileText, Trash2, Upload, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuthContext } from "@/components/auth-provider"

interface Template {
  id: string
  name: string
  description?: string
  questions: any[]
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
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", questions: "[]" })
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

    let questions
    try {
      questions = JSON.parse(newTemplate.questions)
      if (!Array.isArray(questions)) {
        throw new Error("Questions must be an array")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format for questions",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

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
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      const data = await response.json()
      setTemplates([...templates, { ...data.template, createdAt: new Date(data.template.createdAt) }])
      setNewTemplate({ name: "", description: "", questions: "[]" })
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
          questions: JSON.stringify(json.questions, null, 2)
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
                  placeholder='[{"id": "field1", "label": "Question 1", "type": "text", "required": true}]'
                  value={newTemplate.questions}
                  onChange={(e) => setNewTemplate({ ...newTemplate, questions: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter questions as a JSON array. Each question should have: id, label, type, required
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTemplate} className="flex-1">
                  Create Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewTemplate({ name: "", description: "", questions: "[]" })
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Questions:</span>
                <Badge variant="secondary">{template.questions.length} fields</Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template)
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

      {/* View Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Questions ({selectedTemplate.questions.length}):</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(selectedTemplate.questions, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
              Existing reports using this template will keep their data, but new reports cannot use this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
