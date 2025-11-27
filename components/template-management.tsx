"use client"

import React, { useState, useEffect, useRef } from "react"
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
import { Plus, Trash2, FileText, Upload, Edit, Eye, Download, AlertCircle, Check } from "lucide-react"
import { type ReportTemplate, type TemplateField } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { useAuthContext } from "@/components/auth-provider"

interface TemplateManagementProps {
  onDataChange?: () => void
}

export default function TemplateManagement({ onDataChange }: TemplateManagementProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    fields: [] as TemplateField[],
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { dbUser } = useAuthContext()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()
      setTemplates(data.templates || [])
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

  const validateTemplateJson = (json: any): { valid: boolean; error?: string; template?: Partial<ReportTemplate> } => {
    try {
      // Check if it's a valid object
      if (typeof json !== 'object' || json === null) {
        return { valid: false, error: "JSON must be an object" }
      }

      // Check required fields
      if (!json.name || typeof json.name !== 'string') {
        return { valid: false, error: "Template must have a 'name' string field" }
      }

      if (!json.fields || !Array.isArray(json.fields)) {
        return { valid: false, error: "Template must have a 'fields' array" }
      }

      // Validate each field
      const validTypes = ['text', 'number', 'date', 'textarea', 'select']
      for (let i = 0; i < json.fields.length; i++) {
        const field = json.fields[i]
        
        if (!field.id || typeof field.id !== 'string') {
          return { valid: false, error: `Field ${i + 1} must have an 'id' string` }
        }
        
        if (!field.label || typeof field.label !== 'string') {
          return { valid: false, error: `Field ${i + 1} must have a 'label' string` }
        }
        
        if (!field.type || !validTypes.includes(field.type)) {
          return { valid: false, error: `Field ${i + 1} must have a valid 'type' (${validTypes.join(', ')})` }
        }

        if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
          return { valid: false, error: `Select field '${field.id}' must have an 'options' array` }
        }
      }

      return { 
        valid: true, 
        template: {
          name: json.name,
          description: json.description || "",
          fields: json.fields,
        }
      }
    } catch (error) {
      return { valid: false, error: "Invalid JSON format" }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        const validation = validateTemplateJson(json)
        
        if (!validation.valid) {
          setJsonError(validation.error || "Invalid template format")
          return
        }

        setJsonError(null)
        setNewTemplate({
          name: validation.template!.name || "",
          description: validation.template!.description || "",
          fields: validation.template!.fields || [],
        })
        
        toast({
          title: "Success",
          description: "Template loaded from file",
          duration: 3000,
        })
      } catch (error) {
        setJsonError("Failed to parse JSON file")
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    if (newTemplate.fields.length === 0) {
      toast({
        title: "Error",
        description: "Template must have at least one field. Upload a JSON file or add fields manually.",
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
          fields: newTemplate.fields,
          createdBy: dbUser?.telegramId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create template')
      }

      await fetchTemplates()
      setNewTemplate({ name: "", description: "", fields: [] })
      setIsCreateDialogOpen(false)
      setJsonError(null)

      toast({
        title: "Success",
        description: "Template created successfully",
        duration: 3000,
      })

      onDataChange?.()
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          fields: selectedTemplate.fields,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update template')
      }

      await fetchTemplates()
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)

      toast({
        title: "Success",
        description: "Template updated successfully",
        duration: 3000,
      })

      onDataChange?.()
    } catch (error: any) {
      console.error('Error updating template:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?\n\nExisting reports will keep their template snapshot, but no new reports can use this template.`)) {
      return
    }

    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      await fetchTemplates()

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

  const downloadTemplateJson = (template: ReportTemplate) => {
    const jsonData = {
      name: template.name,
      description: template.description,
      fields: template.fields,
    }
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFieldTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: "bg-blue-100 text-blue-800",
      number: "bg-green-100 text-green-800",
      date: "bg-purple-100 text-purple-800",
      textarea: "bg-yellow-100 text-yellow-800",
      select: "bg-pink-100 text-pink-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold">Template Management</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
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
          <p className="text-sm text-muted-foreground">Create and manage report templates</p>
        </div>

        {/* Create Template Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setNewTemplate({ name: "", description: "", fields: [] })
            setJsonError(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>Upload a JSON file or enter template details manually</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* JSON File Upload */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="template-file"
                />
                <label 
                  htmlFor="template-file" 
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload JSON file
                  </span>
                </label>
              </div>

              {jsonError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {jsonError}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="template-name">Template Name</Label>
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

              {newTemplate.fields.length > 0 && (
                <div>
                  <Label>Fields ({newTemplate.fields.length})</Label>
                  <div className="mt-2 border rounded-lg p-3 max-h-40 overflow-auto">
                    {newTemplate.fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 py-1 text-sm">
                        <Check className="w-3 h-3 text-green-500" />
                        <span className="font-medium">{field.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        {field.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateTemplate} 
                  className="flex-1"
                  disabled={!newTemplate.name.trim() || newTemplate.fields.length === 0}
                >
                  Create Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewTemplate({ name: "", description: "", fields: [] })
                    setIsCreateDialogOpen(false)
                    setJsonError(null)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{template.fields.length} fields</Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Field preview */}
              <div className="flex flex-wrap gap-1">
                {template.fields.slice(0, 4).map((field) => (
                  <Badge 
                    key={field.id} 
                    variant="outline" 
                    className={`text-xs ${getFieldTypeBadge(field.type)}`}
                  >
                    {field.type}
                  </Badge>
                ))}
                {template.fields.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.fields.length - 4} more
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setIsViewDialogOpen(true)
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate({ ...template })
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadTemplateJson(template)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTemplate(template.id, template.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
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
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description || "No description"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fields</Label>
              <div className="mt-2 space-y-2">
                {selectedTemplate?.fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{field.label}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className={getFieldTypeBadge(field.type)}>
                          {field.type}
                        </Badge>
                        {field.required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">ID: {field.id}</p>
                    {field.placeholder && (
                      <p className="text-xs text-muted-foreground">Placeholder: {field.placeholder}</p>
                    )}
                    {field.options && (
                      <p className="text-xs text-muted-foreground">
                        Options: {field.options.map(o => o.label).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setSelectedTemplate(null)
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update template name and description</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-template-name">Template Name</Label>
                <Input
                  id="edit-template-name"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-template-description">Description</Label>
                <Textarea
                  id="edit-template-description"
                  value={selectedTemplate.description || ""}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Fields ({selectedTemplate.fields.length})</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  To modify fields, export the template, edit the JSON, and create a new template.
                </p>
                <div className="border rounded-lg p-3 max-h-40 overflow-auto">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-2 py-1 text-sm">
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateTemplate} className="flex-1">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedTemplate(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
