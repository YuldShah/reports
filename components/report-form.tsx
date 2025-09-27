"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Send, AlertCircle } from "lucide-react"
import { createReport } from "@/lib/database"
import { appendToGoogleSheet } from "@/lib/google-sheets"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/lib/database"

interface ReportFormProps {
  user: User
  onCancel: () => void
  onSuccess: () => void
}

export default function ReportForm({ user, onCancel, onSuccess }: ReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    type: "",
    location: "",
    urgency: "",
    affectedSystems: [] as string[],
    reproductionSteps: "",
    expectedOutcome: "",
    actualOutcome: "",
    additionalInfo: "",
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

  const reportTypes = ["Incident Report", "Progress Update", "Issue Report", "Suggestion", "Feedback", "Request"]

  const systemOptions = [
    "Website",
    "Mobile App",
    "Database",
    "Network",
    "Hardware",
    "Software",
    "Security",
    "Communication",
  ]

  const handleSystemChange = (system: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        affectedSystems: [...prev.affectedSystems, system],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        affectedSystems: prev.affectedSystems.filter((s) => s !== system),
      }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = "Title is required"
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required"
    }
    if (!formData.category) {
      errors.category = "Category is required"
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
      // Create report in database
      const report = createReport({
        userId: user.telegramId,
        teamId: user.teamId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority as "low" | "medium" | "high",
        status: "pending",
        category: formData.category,
      })

      // Prepare data for Google Sheets
      const sheetData = {
        timestamp: new Date().toISOString(),
        userName: `${user.firstName} ${user.lastName || ""}`.trim(),
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        status: "pending",
        type: formData.type || "N/A",
        location: formData.location || "N/A",
        urgency: formData.urgency || "N/A",
        affectedSystems: formData.affectedSystems.join(", ") || "N/A",
        reproductionSteps: formData.reproductionSteps || "N/A",
        expectedOutcome: formData.expectedOutcome || "N/A",
        actualOutcome: formData.actualOutcome || "N/A",
        additionalInfo: formData.additionalInfo || "N/A",
      }

      // Send to Google Sheets (team name will be resolved in the function)
      try {
        await appendToGoogleSheet("Team_" + user.teamId, sheetData)
      } catch (sheetError) {
        console.error("Failed to sync to Google Sheets:", sheetError)
        // Continue anyway - report was created successfully
        toast({
          title: "Partial Success",
          description: "Report saved but failed to sync to Google Sheets",
          variant: "default",
        })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Submit Report</h1>
          <p className="text-muted-foreground">Fill out the form below to submit your report</p>
        </div>
      </div>

      {/* Form validation errors */}
      {Object.keys(formErrors).length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
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
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                Report Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
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
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, category: value }))
                    if (formErrors.category) {
                      setFormErrors((prev) => ({ ...prev, category: "" }))
                    }
                  }}
                >
                  <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-sm text-destructive mt-1">{formErrors.category}</p>}
              </div>

              <div>
                <Label htmlFor="type">Report Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority and Urgency */}
        <Card>
          <CardHeader>
            <CardTitle>Priority & Urgency</CardTitle>
            <CardDescription>Help us understand the importance and timeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Priority Level</Label>
              <RadioGroup
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low" className="text-sm">
                    Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="text-sm">
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high" className="text-sm">
                    High
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How urgent is this?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (within hours)</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This week</SelectItem>
                    <SelectItem value="this-month">This month</SelectItem>
                    <SelectItem value="when-possible">When possible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location (if applicable)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Office, department, or specific location"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
            <CardDescription>Additional information for technical issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Affected Systems (check all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {systemOptions.map((system) => (
                  <div key={system} className="flex items-center space-x-2">
                    <Checkbox
                      id={system}
                      checked={formData.affectedSystems.includes(system)}
                      onCheckedChange={(checked) => handleSystemChange(system, checked as boolean)}
                    />
                    <Label htmlFor={system} className="text-sm">
                      {system}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="reproductionSteps">Steps to Reproduce (for bugs/issues)</Label>
              <Textarea
                id="reproductionSteps"
                value={formData.reproductionSteps}
                onChange={(e) => setFormData((prev) => ({ ...prev, reproductionSteps: e.target.value }))}
                placeholder="1. First step&#10;2. Second step&#10;3. Third step..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expectedOutcome">Expected Outcome</Label>
                <Textarea
                  id="expectedOutcome"
                  value={formData.expectedOutcome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expectedOutcome: e.target.value }))}
                  placeholder="What should have happened?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="actualOutcome">Actual Outcome</Label>
                <Textarea
                  id="actualOutcome"
                  value={formData.actualOutcome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, actualOutcome: e.target.value }))}
                  placeholder="What actually happened?"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Any other relevant details</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="additionalInfo">Additional Notes</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => setFormData((prev) => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Screenshots, error messages, suggestions, or any other relevant information"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
