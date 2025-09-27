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

// Mock data storage
const users: User[] = []
const teams: Team[] = []
const reports: Report[] = []

// User operations
export const createUser = (userData: Omit<User, "createdAt">): User => {
  const user: User = {
    ...userData,
    createdAt: new Date(),
  }
  users.push(user)
  return user
}

export const getUserByTelegramId = (telegramId: number): User | null => {
  return users.find((user) => user.telegramId === telegramId) || null
}

export const updateUser = (telegramId: number, updates: Partial<User>): User | null => {
  const userIndex = users.findIndex((user) => user.telegramId === telegramId)
  if (userIndex === -1) return null

  users[userIndex] = { ...users[userIndex], ...updates }
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
  return team
}

export const getAllTeams = (): Team[] => {
  return teams
}

export const getTeamById = (id: string): Team | null => {
  return teams.find((team) => team.id === id) || null
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
  return reports[reportIndex]
}
