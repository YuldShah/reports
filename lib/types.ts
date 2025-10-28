export interface User {
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  teamId?: string
  role: string
  createdAt: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  templateId?: string | null
  createdAt: Date
  createdBy: number | null
}

export interface Report {
  id: string
  userId: number
  teamId: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed"
  category: string
  attachments?: string[]
  templateData?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  fields: TemplateField[]
  createdAt: Date
}

export interface TemplateField {
  id: string
  label: string
  type: "text" | "number" | "date" | "textarea"
  required: boolean
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}