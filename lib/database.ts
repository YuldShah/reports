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
  createdAt: Date
  updatedAt: Date
}

// File-based storage for persistence (server-side only)
let dataPath: string | null = null
let usersFile: string | null = null
let teamsFile: string | null = null
let reportsFile: string | null = null

// Initialize paths only on server side
if (typeof window === 'undefined') {
  const fs = require('fs')
  const path = require('path')
  
  dataPath = path.join(process.cwd(), 'data')
  usersFile = path.join(dataPath, 'users.json')
  teamsFile = path.join(dataPath, 'teams.json')
  reportsFile = path.join(dataPath, 'reports.json')

  // Ensure data directory exists
  if (!fs.existsSync(dataPath)) {
    console.log('Creating data directory:', dataPath)
    fs.mkdirSync(dataPath, { recursive: true })
  }
}

// Helper functions for file operations
const readJsonFile = (filePath: string): any[] => {
  if (typeof window !== 'undefined') return [] // Client-side fallback
  
  try {
    const fs = require('fs')
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(data, (key, value) => {
        // Convert date strings back to Date objects
        if (key.endsWith('At') || key.endsWith('Date')) {
          return new Date(value)
        }
        return value
      })
      console.log(`Loaded ${parsed.length} items from ${filePath}`)
      return parsed
    } else {
      console.log(`File ${filePath} does not exist, returning empty array`)
      return []
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

const writeJsonFile = (filePath: string, data: any[]) => {
  if (typeof window !== 'undefined') return // Client-side fallback
  
  try {
    const fs = require('fs')
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    console.log(`Saved ${data.length} items to ${filePath}`)
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error)
  }
}

// In-memory cache
let users: User[] = []
let teams: Team[] = []
let reports: Report[] = []

// Initialize data on server side
if (typeof window === 'undefined' && usersFile && teamsFile && reportsFile) {
  console.log('Initializing database from files...')
  users = readJsonFile(usersFile)
  teams = readJsonFile(teamsFile)
  reports = readJsonFile(reportsFile)
  console.log(`Database initialized with ${users.length} users, ${teams.length} teams, ${reports.length} reports`)
}

// User operations
export const createUser = (userData: Omit<User, "createdAt">): User => {
  const user: User = {
    ...userData,
    createdAt: new Date(),
  }
  users.push(user)
  console.log(`Creating user: ${user.firstName} (ID: ${user.telegramId})`)
  if (usersFile) {
    writeJsonFile(usersFile, users)
  } else {
    console.warn('usersFile is null, cannot save user data to disk')
  }
  return user
}

export const getUserByTelegramId = (telegramId: number): User | null => {
  return users.find((user) => user.telegramId === telegramId) || null
}

export const updateUser = (telegramId: number, updates: Partial<User>): User | null => {
  const userIndex = users.findIndex((user) => user.telegramId === telegramId)
  if (userIndex === -1) return null

  users[userIndex] = { ...users[userIndex], ...updates }
  console.log(`Updating user: ${users[userIndex].firstName} (ID: ${telegramId})`)
  if (usersFile) {
    writeJsonFile(usersFile, users)
  } else {
    console.warn('usersFile is null, cannot save user updates to disk')
  }
  return users[userIndex]
}

export const getAllUsers = (): User[] => {
  return users
}

// Team operations
export const createTeam = (teamData: Omit<Team, "id" | "createdAt">): Team => {
  const team: Team = {
    ...teamData,
    id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }
  teams.push(team)
  console.log(`Creating team: ${team.name} (ID: ${team.id})`)
  if (teamsFile) {
    writeJsonFile(teamsFile, teams)
  } else {
    console.warn('teamsFile is null, cannot save team data to disk')
  }
  return team
}

export const getAllTeams = (): Team[] => {
  return teams
}

export const getTeamById = (id: string): Team | null => {
  return teams.find((team) => team.id === id) || null
}

export const deleteTeam = (id: string): boolean => {
  const teamIndex = teams.findIndex((team) => team.id === id)
  if (teamIndex === -1) return false

  // Remove team from teams array
  teams.splice(teamIndex, 1)
  console.log(`Deleting team: ${id}`)
  
  // Unassign all users from this team
  users.forEach(user => {
    if (user.teamId === id) {
      user.teamId = undefined
    }
  })

  // Save both teams and users files
  if (teamsFile) {
    writeJsonFile(teamsFile, teams)
  } else {
    console.warn('teamsFile is null, cannot save team data to disk')
  }
  
  if (usersFile) {
    writeJsonFile(usersFile, users)
  } else {
    console.warn('usersFile is null, cannot save user data to disk')
  }
  
  return true
}

export const getUsersByTeam = (teamId: string): User[] => {
  return users.filter((user) => user.teamId === teamId)
}

// Report operations
export const createReport = (reportData: Omit<Report, "id" | "createdAt" | "updatedAt">): Report => {
  const report: Report = {
    ...reportData,
    id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  reports.push(report)
  if (reportsFile) writeJsonFile(reportsFile, reports)
  return report
}

export const getAllReports = (): Report[] => {
  return reports
}

export const getReportsByTeam = (teamId: string): Report[] => {
  return reports.filter((report) => report.teamId === teamId)
}

export const getReportsByUser = (userId: number): Report[] => {
  return reports.filter((report) => report.userId === userId)
}

export const updateReport = (id: string, updates: Partial<Report>): Report | null => {
  const reportIndex = reports.findIndex((report) => report.id === id)
  if (reportIndex === -1) return null

  reports[reportIndex] = {
    ...reports[reportIndex],
    ...updates,
    updatedAt: new Date(),
  }
  if (reportsFile) writeJsonFile(reportsFile, reports)
  return reports[reportIndex]
}
