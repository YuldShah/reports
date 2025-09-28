import { Database } from 'sqlite3'
import { promisify } from 'util'

// Type definitions for callback parameters
type SQLiteError = Error | null
type SQLiteRows = any[]
type SQLiteCallback = (err: SQLiteError, rows: SQLiteRows) => void

export interface User {
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  teamId?: string
  role: "admin" | "employee"
  createdAt: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  templateId?: string
  createdAt: Date
  createdBy: number
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

// Database connection
let db: Database | null = null

const getDatabase = (): Database => {
  if (!db) {
    db = new Database('./database.db')
  }
  return db
}

// Helper function to run queries
const query = async (sql: string, params: any[] = []): Promise<any> => {
  const database = getDatabase()
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err: SQLiteError, rows: SQLiteRows) => {
      if (err) {
        reject(err)
      } else {
        resolve({ rows })
      }
    })
  })
}

// Helper function to run single queries
const run = async (sql: string, params: any[] = []): Promise<any> => {
  const database = getDatabase()
  return new Promise((resolve, reject) => {
    database.run(sql, params, function(this: Database, err: SQLiteError) {
      if (err) {
        reject(err)
      } else {
        resolve({ rowsAffected: this.changes, insertId: this.lastID })
      }
    })
  })
}

// User operations
export const createUser = async (userData: Omit<User, "createdAt">): Promise<User> => {
  const { telegramId, firstName, lastName, username, photoUrl, teamId, role } = userData
  
  const result = await query(
    `INSERT INTO users (telegram_id, first_name, last_name, username, photo_url, team_id, role) 
     VALUES (?, ?, ?, ?, ?, ?, ?) 
     RETURNING telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at`,
    [telegramId, firstName, lastName, username, photoUrl, teamId, role]
  )

  const row = result.rows[0]
  return {
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    photoUrl: row.photo_url,
    teamId: row.team_id,
    role: row.role,
    createdAt: row.created_at
  }
}

export const getUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const result = await query(
    'SELECT telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at FROM users WHERE telegram_id = ?',
    [telegramId]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    photoUrl: row.photo_url,
    teamId: row.team_id,
    role: row.role,
    createdAt: row.created_at
  }
}

export const updateUser = async (telegramId: number, updates: Partial<User>): Promise<User | null> => {
  const fields = []
  const values = []
  let paramCount = 1

  if (updates.firstName !== undefined) {
    fields.push(`first_name = $${paramCount++}`)
    values.push(updates.firstName)
  }
  if (updates.lastName !== undefined) {
    fields.push(`last_name = $${paramCount++}`)
    values.push(updates.lastName)
  }
  if (updates.username !== undefined) {
    fields.push(`username = $${paramCount++}`)
    values.push(updates.username)
  }
  if (updates.photoUrl !== undefined) {
    fields.push(`photo_url = $${paramCount++}`)
    values.push(updates.photoUrl)
  }
  if (updates.teamId !== undefined) {
    fields.push(`team_id = $${paramCount++}`)
    values.push(updates.teamId)
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${paramCount++}`)
    values.push(updates.role)
  }

  if (fields.length === 0) return null

  values.push(telegramId)

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} 
     WHERE telegram_id = $${paramCount} 
     RETURNING telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at`,
    values
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    photoUrl: row.photo_url,
    teamId: row.team_id,
    role: row.role,
    createdAt: row.created_at
  }
}

export const getAllUsers = async (): Promise<User[]> => {
  const result = await query(
    'SELECT telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at FROM users ORDER BY created_at DESC'
  )

  return result.rows.map((row: any) => ({
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    photoUrl: row.photo_url,
    teamId: row.team_id,
    role: row.role,
    createdAt: row.created_at
  }))
}

// Team operations
export const createTeam = async (teamData: Omit<Team, "id" | "createdAt">): Promise<Team> => {
  const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const { name, description, templateId, createdBy } = teamData

  const result = await query(
    'INSERT INTO teams (id, name, description, template_id, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id, name, description, template_id, created_by, created_at',
    [teamId, name, description, templateId, createdBy]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateId: row.template_id,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

export const getAllTeams = async (): Promise<Team[]> => {
  const result = await query(
    'SELECT id, name, description, template_id, created_by, created_at FROM teams ORDER BY created_at DESC'
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    templateId: row.template_id,
    createdBy: row.created_by,
    createdAt: row.created_at
  }))
}

export const getTeamById = async (id: string): Promise<Team | null> => {
  const result = await query(
    'SELECT id, name, description, template_id, created_by, created_at FROM teams WHERE id = ?',
    [id]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateId: row.template_id,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

export const deleteTeam = async (id: string): Promise<boolean> => {
  try {
    // Unassign all users from this team
    await run('UPDATE users SET team_id = NULL WHERE team_id = ?', [id])
    
    // Delete the team
    const result = await run('DELETE FROM teams WHERE id = ?', [id])
    
    return result.rowsAffected > 0
  } catch (error) {
    console.error('Error deleting team:', error)
    throw error
  }
}

export const getUsersByTeam = async (teamId: string): Promise<User[]> => {
  const result = await query(
    'SELECT telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at FROM users WHERE team_id = ? ORDER BY first_name',
    [teamId]
  )

  return result.rows.map((row: any) => ({
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    photoUrl: row.photo_url,
    teamId: row.team_id,
    role: row.role,
    createdAt: row.created_at
  }))
}

export const updateTeamTemplate = async (teamId: string, templateId: string | null): Promise<Team | null> => {
  const result = await query(
    'UPDATE teams SET template_id = ? WHERE id = ? RETURNING id, name, description, template_id, created_by, created_at',
    [templateId, teamId]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateId: row.template_id,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

// Report operations
export const createReport = async (reportData: Omit<Report, "id" | "createdAt" | "updatedAt">): Promise<Report> => {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const { userId, teamId, title, description, priority, status, category, attachments, templateData } = reportData

  const result = await query(
    `INSERT INTO reports (id, user_id, team_id, title, description, priority, status, category, attachments, template_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
     RETURNING id, user_id, team_id, title, description, priority, status, category, attachments, template_data, created_at, updated_at`,
    [reportId, userId, teamId, title, description, priority, status, category, attachments || [], JSON.stringify(templateData || {})]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: row.category,
    attachments: row.attachments,
    templateData: row.template_data ? JSON.parse(row.template_data) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const getAllReports = async (): Promise<Report[]> => {
  const result = await query(
    'SELECT id, user_id, team_id, title, description, priority, status, category, attachments, template_data, created_at, updated_at FROM reports ORDER BY created_at DESC'
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: row.category,
    attachments: row.attachments,
    templateData: row.template_data ? JSON.parse(row.template_data) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export const getReportsByTeam = async (teamId: string): Promise<Report[]> => {
  const result = await query(
    'SELECT id, user_id, team_id, title, description, priority, status, category, attachments, template_data, created_at, updated_at FROM reports WHERE team_id = ? ORDER BY created_at DESC',
    [teamId]
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: row.category,
    attachments: row.attachments,
    templateData: row.template_data ? JSON.parse(row.template_data) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export const getReportsByUser = async (userId: number): Promise<Report[]> => {
  const result = await query(
    'SELECT id, user_id, team_id, title, description, priority, status, category, attachments, template_data, created_at, updated_at FROM reports WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: row.category,
    attachments: row.attachments,
    templateData: row.template_data ? JSON.parse(row.template_data) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export const updateReport = async (id: string, updates: Partial<Report>): Promise<Report | null> => {
  const fields = []
  const values = []
  let paramCount = 1

  if (updates.title !== undefined) {
    fields.push(`title = $${paramCount++}`)
    values.push(updates.title)
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`)
    values.push(updates.description)
  }
  if (updates.priority !== undefined) {
    fields.push(`priority = $${paramCount++}`)
    values.push(updates.priority)
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramCount++}`)
    values.push(updates.status)
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${paramCount++}`)
    values.push(updates.category)
  }
  if (updates.attachments !== undefined) {
    fields.push(`attachments = $${paramCount++}`)
    values.push(updates.attachments)
  }
  if (updates.templateData !== undefined) {
    fields.push(`template_data = $${paramCount++}`)
    values.push(JSON.stringify(updates.templateData))
  }

  if (fields.length === 0) return null

  fields.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(id)

  const result = await query(
    `UPDATE reports SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, user_id, team_id, title, description, priority, status, category, attachments, template_data, created_at, updated_at`,
    values
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    category: row.category,
    attachments: row.attachments,
    templateData: row.template_data ? JSON.parse(row.template_data) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}