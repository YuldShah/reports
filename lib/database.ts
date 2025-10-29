import { Pool, PoolClient, QueryResult } from 'pg'
import { randomUUID } from 'crypto'

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
  createdBy: number | null
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
  templateId: string
  title: string
  answers: Record<string, any>
  templateData: Record<string, any>
  createdAt: Date
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const shouldUseSSL = process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production'

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined,
})

const parseJsonField = <T>(value: unknown, fallback: T): T => {
  if (value == null) {
    return fallback
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Failed to parse JSON field from string', error)
      return fallback
    }
  }

  return value as T
}

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return value as number
}

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value
  return new Date(value as string)
}

const getClient = async (): Promise<PoolClient> => pool.connect()

const mapUserRow = (row: any): User => ({
  telegramId: toNumber(row.telegram_id),
  firstName: row.first_name,
  lastName: row.last_name ?? undefined,
  username: row.username ?? undefined,
  photoUrl: row.photo_url ?? undefined,
  teamId: row.team_id ?? undefined,
  role: row.role,
  createdAt: toDate(row.created_at),
})

const mapTemplateRow = (row: any): Template => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  questions: parseJsonField<any[]>(row.questions, []),
  createdAt: toDate(row.created_at),
  createdBy: row.created_by !== null ? toNumber(row.created_by) : null,
})

const mapTeamRow = (row: any): Team => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  templateId: row.template_id ?? null,
  createdAt: toDate(row.created_at),
  createdBy: row.created_by !== null ? toNumber(row.created_by) : null,
})

const mapReportRow = (row: any): Report => ({
  id: row.id,
  userId: toNumber(row.user_id),
  teamId: row.team_id,
  templateId: row.template_id,
  title: row.title,
  answers: parseJsonField<Record<string, any>>(row.answers, {}),
  templateData: parseJsonField<Record<string, any>>(row.template_data, {}),
  createdAt: toDate(row.created_at),
})

const runQuery = async <T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: any[] = [],
): Promise<QueryResult<T>> => {
  const client = await getClient()
  try {
    return await client.query<T>(text, params)
  } finally {
    client.release()
  }
}

let templateSheetRegistryInitialized = false

const ensureTemplateSheetRegistry = async () => {
  if (templateSheetRegistryInitialized) {
    return
  }

  await runQuery(
    `CREATE TABLE IF NOT EXISTS template_sheet_registry (
      template_key TEXT PRIMARY KEY,
      sheet_id BIGINT NOT NULL
    )`
  )

  templateSheetRegistryInitialized = true
}

export const getTemplateSheetMapping = async (templateKey: string): Promise<number | null> => {
  await ensureTemplateSheetRegistry()
  const result = await runQuery<{ sheet_id: string | number }>(
    `SELECT sheet_id FROM template_sheet_registry WHERE template_key = $1 LIMIT 1`,
    [templateKey],
  )

  if (result.rows.length === 0) {
    return null
  }

  const rawValue = result.rows[0].sheet_id
  const numeric = typeof rawValue === 'string' ? Number(rawValue) : rawValue
  return Number.isFinite(numeric) ? Number(numeric) : null
}

export const upsertTemplateSheetMapping = async (templateKey: string, sheetId: number): Promise<void> => {
  await ensureTemplateSheetRegistry()
  await runQuery(
    `INSERT INTO template_sheet_registry (template_key, sheet_id)
     VALUES ($1, $2)
     ON CONFLICT (template_key) DO UPDATE SET sheet_id = EXCLUDED.sheet_id`,
    [templateKey, sheetId],
  )
}

export const deleteTemplateSheetMapping = async (templateKey: string): Promise<void> => {
  await ensureTemplateSheetRegistry()
  await runQuery(`DELETE FROM template_sheet_registry WHERE template_key = $1`, [templateKey])
}

// User operations
export const createUser = async (userData: Omit<User, 'createdAt'>): Promise<User> => {
  const { telegramId, firstName, lastName, username, photoUrl, teamId, role } = userData

  const result = await runQuery(
    `INSERT INTO users (telegram_id, first_name, last_name, username, photo_url, team_id, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at`,
    [telegramId, firstName, lastName ?? null, username ?? null, photoUrl ?? null, teamId ?? null, role],
  )

  return mapUserRow(result.rows[0])
}

export const getUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const result = await runQuery(
    `SELECT telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at
     FROM users
     WHERE telegram_id = $1`,
    [telegramId],
  )

  if (result.rows.length === 0) return null
  return mapUserRow(result.rows[0])
}

export const updateUser = async (telegramId: number, updates: Partial<User>): Promise<User | null> => {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.firstName !== undefined) {
    fields.push(`first_name = $${paramIndex++}`)
    values.push(updates.firstName)
  }
  if (updates.lastName !== undefined) {
    fields.push(`last_name = $${paramIndex++}`)
    values.push(updates.lastName)
  }
  if (updates.username !== undefined) {
    fields.push(`username = $${paramIndex++}`)
    values.push(updates.username)
  }
  if (updates.photoUrl !== undefined) {
    fields.push(`photo_url = $${paramIndex++}`)
    values.push(updates.photoUrl)
  }
  if (updates.teamId !== undefined) {
    fields.push(`team_id = $${paramIndex++}`)
    values.push(updates.teamId)
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${paramIndex++}`)
    values.push(updates.role)
  }

  if (fields.length === 0) {
    return getUserByTelegramId(telegramId)
  }

  values.push(telegramId)
  const result = await runQuery(
    `UPDATE users SET ${fields.join(', ')}
     WHERE telegram_id = $${paramIndex}
     RETURNING telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at`,
    values,
  )

  if (result.rows.length === 0) return null
  return mapUserRow(result.rows[0])
}

export const getAllUsers = async (): Promise<User[]> => {
  const result = await runQuery(
    `SELECT telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at
     FROM users
     ORDER BY created_at DESC`,
  )

  return result.rows.map(mapUserRow)
}

// Template operations
export const createTemplate = async (templateData: Omit<Template, 'createdAt'>): Promise<Template> => {
  const { id, name, description, questions, createdBy } = templateData

  const result = await runQuery(
    `INSERT INTO templates (id, name, description, questions, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, description, questions, created_at, created_by`,
    [id, name, description ?? null, JSON.stringify(questions), createdBy ?? null],
  )

  return mapTemplateRow(result.rows[0])
}

export const getTemplateById = async (id: string): Promise<Template | null> => {
  const result = await runQuery(
    `SELECT id, name, description, questions, created_at, created_by
     FROM templates
     WHERE id = $1`,
    [id],
  )

  if (result.rows.length === 0) return null
  return mapTemplateRow(result.rows[0])
}

export const getAllTemplates = async (): Promise<Template[]> => {
  const result = await runQuery(
    `SELECT id, name, description, questions, created_at, created_by
     FROM templates
     ORDER BY created_at DESC`,
  )

  return result.rows.map(mapTemplateRow)
}

export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<Template | null> => {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`)
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`)
    values.push(updates.description)
  }
  if (updates.questions !== undefined) {
    fields.push(`questions = $${paramIndex++}`)
    values.push(JSON.stringify(updates.questions))
  }

  if (fields.length === 0) {
    return getTemplateById(id)
  }

  values.push(id)
  const result = await runQuery(
    `UPDATE templates SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, description, questions, created_at, created_by`,
    values,
  )

  if (result.rows.length === 0) return null
  return mapTemplateRow(result.rows[0])
}

export const deleteTemplate = async (id: string): Promise<boolean> => {
  const result = await runQuery('DELETE FROM templates WHERE id = $1', [id])
  return (result.rowCount ?? 0) > 0
}

// Team operations
export const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>): Promise<Team> => {
  const teamId = randomUUID()
  const { name, description, templateId, createdBy } = teamData

  const result = await runQuery(
    `INSERT INTO teams (id, name, description, template_id, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, description, template_id, created_by, created_at`,
    [teamId, name, description ?? null, templateId ?? null, createdBy ?? null],
  )

  return mapTeamRow(result.rows[0])
}

export const getAllTeams = async (): Promise<Team[]> => {
  const result = await runQuery(
    `SELECT id, name, description, template_id, created_by, created_at
     FROM teams
     ORDER BY created_at DESC`,
  )

  return result.rows.map(mapTeamRow)
}

export const getTeamById = async (id: string): Promise<Team | null> => {
  const result = await runQuery(
    `SELECT id, name, description, template_id, created_by, created_at
     FROM teams
     WHERE id = $1`,
    [id],
  )

  if (result.rows.length === 0) return null
  return mapTeamRow(result.rows[0])
}

export const getUsersByTeam = async (teamId: string): Promise<User[]> => {
  const result = await runQuery(
    `SELECT telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at
     FROM users
     WHERE team_id = $1
     ORDER BY first_name`,
    [teamId],
  )

  return result.rows.map(mapUserRow)
}

export const updateTeamTemplate = async (teamId: string, templateId: string | null): Promise<Team | null> => {
  const result = await runQuery(
    `UPDATE teams
     SET template_id = $1
     WHERE id = $2
     RETURNING id, name, description, template_id, created_by, created_at`,
    [templateId, teamId],
  )

  if (result.rows.length === 0) return null
  return mapTeamRow(result.rows[0])
}

export const deleteTeam = async (id: string): Promise<boolean> => {
  const client = await getClient()

  try {
    await client.query('BEGIN')
    await client.query('UPDATE users SET team_id = NULL WHERE team_id = $1', [id])
    const result = await client.query('DELETE FROM teams WHERE id = $1', [id])
    await client.query('COMMIT')
  return (result.rowCount ?? 0) > 0
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Report operations
export const createReport = async (reportData: Omit<Report, 'id' | 'createdAt'>): Promise<Report> => {
  const reportId = randomUUID()
  const { userId, teamId, templateId, title, answers, templateData } = reportData

  const result = await runQuery(
    `INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, team_id, template_id, title, answers, template_data, created_at`,
    [
      reportId,
      userId,
      teamId,
      templateId,
      title,
      JSON.stringify(answers),
      JSON.stringify(templateData ?? {}),
    ],
  )

  return mapReportRow(result.rows[0])
}

export const getAllReports = async (): Promise<Report[]> => {
  const result = await runQuery(
    `SELECT id, user_id, team_id, template_id, title, answers, template_data, created_at
     FROM reports
     ORDER BY created_at DESC`,
  )

  return result.rows.map(mapReportRow)
}

export const getReportsByTeam = async (teamId: string): Promise<Report[]> => {
  const result = await runQuery(
    `SELECT id, user_id, team_id, template_id, title, answers, template_data, created_at
     FROM reports
     WHERE team_id = $1
     ORDER BY created_at DESC`,
    [teamId],
  )

  return result.rows.map(mapReportRow)
}

export const getReportsByUser = async (userId: number): Promise<Report[]> => {
  const result = await runQuery(
    `SELECT id, user_id, team_id, template_id, title, answers, template_data, created_at
     FROM reports
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  )

  return result.rows.map(mapReportRow)
}

export const updateReport = async (id: string, updates: Partial<Report>): Promise<Report | null> => {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`)
    values.push(updates.title)
  }
  if (updates.answers !== undefined) {
    fields.push(`answers = $${paramIndex++}`)
    values.push(JSON.stringify(updates.answers))
  }
  if (updates.templateData !== undefined) {
    fields.push(`template_data = $${paramIndex++}`)
    values.push(JSON.stringify(updates.templateData))
  }

  if (fields.length === 0) {
    const result = await runQuery(
      `SELECT id, user_id, team_id, template_id, title, answers, template_data, created_at
       FROM reports
       WHERE id = $1`,
      [id],
    )
    return result.rows.length ? mapReportRow(result.rows[0]) : null
  }

  values.push(id)
  const result = await runQuery(
    `UPDATE reports SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, user_id, team_id, template_id, title, answers, template_data, created_at`,
    values,
  )

  if (result.rows.length === 0) return null
  return mapReportRow(result.rows[0])
}

export const closeDatabase = async (): Promise<void> => {
  await pool.end()
}