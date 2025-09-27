import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

const dbPath = path.join(process.cwd(), 'reports.db')

let db: any = null

export const initDb = async () => {
  if (db) return db
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        telegramId INTEGER PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT,
        username TEXT,
        photoUrl TEXT,
        teamId TEXT,
        role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        createdBy INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users (telegramId)
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        teamId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
        category TEXT NOT NULL,
        attachments TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (telegramId),
        FOREIGN KEY (teamId) REFERENCES teams (id)
      );

      CREATE INDEX IF NOT EXISTS idx_users_teamId ON users(teamId);
      CREATE INDEX IF NOT EXISTS idx_reports_userId ON reports(userId);
      CREATE INDEX IF NOT EXISTS idx_reports_teamId ON reports(teamId);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    `)

    console.log('✅ Database initialized successfully')
    return db
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

export const getDb = async () => {
  if (!db) {
    await initDb()
  }
  return db
}

// User operations
export const createUser = async (userData: {
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  teamId?: string
  role: 'admin' | 'employee'
}) => {
  const database = await getDb()
  const result = await database.run(
    `INSERT INTO users (telegramId, firstName, lastName, username, photoUrl, teamId, role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userData.telegramId, userData.firstName, userData.lastName, userData.username, userData.photoUrl, userData.teamId, userData.role]
  )
  return getUserByTelegramId(userData.telegramId)
}

export const getUserByTelegramId = async (telegramId: number) => {
  const database = await getDb()
  return await database.get('SELECT * FROM users WHERE telegramId = ?', [telegramId])
}

export const updateUser = async (telegramId: number, updates: any) => {
  const database = await getDb()
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
  const values = Object.values(updates)
  await database.run(
    `UPDATE users SET ${fields} WHERE telegramId = ?`,
    [...values, telegramId]
  )
  return getUserByTelegramId(telegramId)
}

export const getAllUsers = async () => {
  const database = await getDb()
  return await database.all('SELECT * FROM users ORDER BY createdAt DESC')
}

// Team operations
export const createTeam = async (teamData: {
  name: string
  description?: string
  createdBy: number
}) => {
  const database = await getDb()
  const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  await database.run(
    `INSERT INTO teams (id, name, description, createdBy)
     VALUES (?, ?, ?, ?)`,
    [teamId, teamData.name, teamData.description, teamData.createdBy]
  )
  return getTeamById(teamId)
}

export const getAllTeams = async () => {
  const database = await getDb()
  return await database.all('SELECT * FROM teams ORDER BY createdAt DESC')
}

export const getTeamById = async (id: string) => {
  const database = await getDb()
  return await database.get('SELECT * FROM teams WHERE id = ?', [id])
}

export const getUsersByTeam = async (teamId: string) => {
  const database = await getDb()
  return await database.all('SELECT * FROM users WHERE teamId = ?', [teamId])
}

// Report operations
export const createReport = async (reportData: {
  userId: number
  teamId: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
  category: string
  attachments?: string[]
}) => {
  const database = await getDb()
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const attachmentsJson = reportData.attachments ? JSON.stringify(reportData.attachments) : null
  
  await database.run(
    `INSERT INTO reports (id, userId, teamId, title, description, priority, status, category, attachments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [reportId, reportData.userId, reportData.teamId, reportData.title, reportData.description, 
     reportData.priority, reportData.status, reportData.category, attachmentsJson]
  )
  
  return getReportById(reportId)
}

export const getReportById = async (id: string) => {
  const database = await getDb()
  const report = await database.get('SELECT * FROM reports WHERE id = ?', [id])
  if (report && report.attachments) {
    report.attachments = JSON.parse(report.attachments)
  }
  return report
}

export const getAllReports = async () => {
  const database = await getDb()
  const reports = await database.all('SELECT * FROM reports ORDER BY createdAt DESC')
  return reports.map(report => ({
    ...report,
    attachments: report.attachments ? JSON.parse(report.attachments) : null,
    createdAt: new Date(report.createdAt),
    updatedAt: new Date(report.updatedAt)
  }))
}

export const getReportsByTeam = async (teamId: string) => {
  const database = await getDb()
  const reports = await database.all('SELECT * FROM reports WHERE teamId = ? ORDER BY createdAt DESC', [teamId])
  return reports.map(report => ({
    ...report,
    attachments: report.attachments ? JSON.parse(report.attachments) : null,
    createdAt: new Date(report.createdAt),
    updatedAt: new Date(report.updatedAt)
  }))
}

export const getReportsByUser = async (userId: number) => {
  const database = await getDb()
  const reports = await database.all('SELECT * FROM reports WHERE userId = ? ORDER BY createdAt DESC', [userId])
  return reports.map(report => ({
    ...report,
    attachments: report.attachments ? JSON.parse(report.attachments) : null,
    createdAt: new Date(report.createdAt),
    updatedAt: new Date(report.updatedAt)
  }))
}

export const updateReport = async (id: string, updates: any) => {
  const database = await getDb()
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
  const values = Object.values(updates)
  await database.run(
    `UPDATE reports SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [...values, id]
  )
  return getReportById(id)
}