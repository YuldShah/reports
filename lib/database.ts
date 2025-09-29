import { Database, RunResult } from 'sqlite3'
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
  role: string
  createdAt: Date
}

export interface Template {
  id: string
  name: string
  description?: string
  questions: any[]
  createdAt: Date
  createdBy: number
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
  templateId: string
  title: string
  answers: Record<string, any>
  createdAt: Date
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
    database.run(sql, params, function(err: SQLiteError) {
      if (err) {
        reject(err)
      } else {
        // @ts-ignore - this context has changes and lastID properties in sqlite3
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

// Template operations
export const createTemplate = async (templateData: Omit<Template, "createdAt">): Promise<Template> => {
  const { id, name, description, questions, createdBy } = templateData
  
  const result = await query(
    `INSERT INTO templates (id, name, description, questions, created_by) 
     VALUES (?, ?, ?, ?, ?) 
     RETURNING id, name, description, questions, created_at, created_by`,
    [id, name, description, JSON.stringify(questions), createdBy]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    questions: JSON.parse(row.questions),
    createdAt: row.created_at,
    createdBy: row.created_by
  }
}

export const getTemplateById = async (id: string): Promise<Template | null> => {
  const result = await query(
    'SELECT id, name, description, questions, created_at, created_by FROM templates WHERE id = ?',
    [id]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    questions: JSON.parse(row.questions),
    createdAt: row.created_at,
    createdBy: row.created_by
  }
}

export const getAllTemplates = async (): Promise<Template[]> => {
  const result = await query(
    'SELECT id, name, description, questions, created_at, created_by FROM templates ORDER BY created_at DESC'
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    questions: JSON.parse(row.questions),
    createdAt: row.created_at,
    createdBy: row.created_by
  }))
}

export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<Template | null> => {
  const fields = []
  const values = []
  let paramCount = 1

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`)
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`)
    values.push(updates.description)
  }
  if (updates.questions !== undefined) {
    fields.push(`questions = $${paramCount++}`)
    values.push(JSON.stringify(updates.questions))
  }

  if (fields.length === 0) return getTemplateById(id)

  values.push(id)
  const result = await query(
    `UPDATE templates SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, name, description, questions, created_at, created_by`,
    values
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    questions: JSON.parse(row.questions),
    createdAt: row.created_at,
    createdBy: row.created_by
  }
}

export const deleteTemplate = async (id: string): Promise<boolean> => {
  const result = await run('DELETE FROM templates WHERE id = ?', [id])
  return result.rowsAffected > 0
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
export const createReport = async (reportData: Omit<Report, "id" | "createdAt">): Promise<Report> => {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const { userId, teamId, templateId, title, answers } = reportData

  const result = await query(
    `INSERT INTO reports (id, user_id, team_id, template_id, title, answers) 
     VALUES (?, ?, ?, ?, ?, ?) 
     RETURNING id, user_id, team_id, template_id, title, answers, created_at`,
    [reportId, userId, teamId, templateId, title, JSON.stringify(answers)]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    templateId: row.template_id,
    title: row.title,
    answers: JSON.parse(row.answers),
    createdAt: row.created_at
  }
}

export const getAllReports = async (): Promise<Report[]> => {
  const result = await query(
    'SELECT id, user_id, team_id, template_id, title, answers, created_at FROM reports ORDER BY created_at DESC'
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    templateId: row.template_id,
    title: row.title,
    answers: JSON.parse(row.answers),
    createdAt: row.created_at
  }))
}

export const getReportsByTeam = async (teamId: string): Promise<Report[]> => {
  const result = await query(
    'SELECT id, user_id, team_id, template_id, title, answers, created_at FROM reports WHERE team_id = ? ORDER BY created_at DESC',
    [teamId]
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    templateId: row.template_id,
    title: row.title,
    answers: JSON.parse(row.answers),
    createdAt: row.created_at
  }))
}

export const getReportsByUser = async (userId: number): Promise<Report[]> => {
  const result = await query(
    'SELECT id, user_id, team_id, template_id, title, answers, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    templateId: row.template_id,
    title: row.title,
    answers: JSON.parse(row.answers),
    createdAt: row.created_at
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
  if (updates.answers !== undefined) {
    fields.push(`answers = $${paramCount++}`)
    values.push(JSON.stringify(updates.answers))
  }

  if (fields.length === 0) return null

  values.push(id)

  const result = await query(
    `UPDATE reports SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, user_id, team_id, template_id, title, answers, created_at`,
    values
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    templateId: row.template_id,
    title: row.title,
    answers: JSON.parse(row.answers),
    createdAt: row.created_at
  }
}