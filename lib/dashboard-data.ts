import { cookies } from "next/headers"
import { runQuery, getTeamIdsLedBy } from "@/lib/database"
import { isAdmin } from "@/lib/telegram"
import { normalizeText } from "@/lib/utils"
import { SESSION_COOKIE, verifySession, type DashboardRole, type SessionPayload } from "@/lib/session"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScopeRole = "admin" | "lead" | "member" | "none"

export interface ScopeContext {
  role: ScopeRole
  telegramId: number
  teamIds: string[] | null // null = all teams (admin); [] = no access
}

export interface DashboardUser {
  telegramId: number
  role: DashboardRole
  teamId?: string
  name: string
  username?: string
  photoUrl?: string
}

export interface ReportCell {
  fieldId: string
  label: string
  type: string
  value: unknown
  photoUrls?: string[]
}

export interface EnrichedReportRow {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  user: { telegramId: number; name: string; username?: string }
  team: { id: string; name: string }
  template: { id: string; name: string; isStudentTracker: boolean }
  answers: Record<string, unknown>
  cells: ReportCell[]
}

export interface ReportFilters {
  teamId?: string
  userId?: number
  templateId?: string
  from?: string
  to?: string
  search?: string
  submitter?: "self" | "others" // self = my submissions, others = team members'
  page?: number
  pageSize?: number
}

export interface ReportsResult {
  rows: EnrichedReportRow[]
  total: number
  page: number
  pageSize: number
}

export interface SheetDescriptor {
  templateId: string
  name: string
  isStudentTracker: boolean
  rowCount: number
}

export interface SheetColumn {
  key: string
  label: string
  type: string
  numeric: boolean
}

export interface SheetData {
  templateId: string
  name: string
  isStudentTracker: boolean
  columns: SheetColumn[]
  rows: Array<Record<string, unknown>>
  totals: Record<string, number>
}

export interface SummaryKpis {
  totalReports: number
  reportsToday: number
  reports7d: number
  reports30d: number
  activeSubmitters: number
  teams: number
  templates: number
  trend: Array<{ date: string; count: number }>
}

export interface AnalyticsPayload {
  range: { from: string; to: string }
  trend: Array<{ date: string; count: number }>
  perTeam: Array<{ teamId: string; name: string; count: number }>
  perTemplate: Array<{ templateId: string; name: string; count: number }>
  leaderboard: Array<{ telegramId: number; name: string; count: number }>
  studentTracker: Array<{ course: string; total: number }>
}

// ---------------------------------------------------------------------------
// Session / scope helpers
// ---------------------------------------------------------------------------

export async function getServerSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifySession(token)
}

/**
 * Resolve a user's live access scope from the DB (not the session, so lead/team
 * assignment changes take effect immediately):
 *  - admin: env ADMIN_TELEGRAM_IDS or users.role text == "admin" → all teams
 *  - lead: assigned as lead of >= 1 team (teams.lead_telegram_id) → those teams
 *  - member: has a team_id → that team
 *  - none: no team and not a lead → no team-wide access
 */
export async function resolveScope(telegramId: number): Promise<ScopeContext> {
  const userRes = await runQuery<{ role: string; team_id: string | null }>(
    `SELECT role, team_id FROM users WHERE telegram_id = $1`,
    [telegramId],
  )
  const user = userRes.rows[0]

  if (isAdmin(telegramId) || user?.role === "admin") {
    return { role: "admin", telegramId, teamIds: null }
  }

  const ledTeamIds = await getTeamIdsLedBy(telegramId)
  const teamSet = new Set<string>(ledTeamIds)
  if (user?.team_id) teamSet.add(user.team_id)
  const teamIds = Array.from(teamSet)

  const role: ScopeRole = ledTeamIds.length > 0 ? "lead" : user?.team_id ? "member" : "none"
  return { role, telegramId, teamIds }
}

/** Convenience: current request's scope, or null if unauthenticated. */
export async function getScope(): Promise<ScopeContext | null> {
  const session = await getServerSession()
  if (!session) return null
  return resolveScope(session.sub)
}

/** Resolve a logged-in dashboard user (role + team) from the DB. Null if the user doesn't exist. */
export async function resolveDashboardUser(telegramId: number): Promise<DashboardUser | null> {
  const result = await runQuery<{
    telegram_id: string | number
    first_name: string
    last_name: string | null
    username: string | null
    photo_url: string | null
    team_id: string | null
    role: string
  }>(
    `SELECT telegram_id, first_name, last_name, username, photo_url, team_id, role
     FROM users WHERE telegram_id = $1`,
    [telegramId],
  )
  if (result.rows.length === 0) return null
  const row = result.rows[0]

  const isAdminUser = isAdmin(telegramId) || row.role === "admin"
  const role: DashboardRole = isAdminUser ? "admin" : row.role === "lead" ? "lead" : "employee"

  return {
    telegramId: Number(row.telegram_id),
    role,
    teamId: row.team_id ?? undefined,
    name: buildName(row.first_name, row.last_name) || (row.username ? `@${row.username}` : `#${telegramId}`),
    username: row.username ?? undefined,
    photoUrl: row.photo_url ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

const PHOTO_TYPES = new Set(["file", "photo", "image"])
const DAY_MS = 86400000

function buildName(first?: string | null, last?: string | null): string {
  return normalizeText([first, last].filter(Boolean).join(" "))
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}

function toUrlArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.length > 0)
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function toNumeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, "").replace(",", ".")
    if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function buildCells(questions: any[], answers: Record<string, unknown>): ReportCell[] {
  if (!Array.isArray(questions)) return []
  return questions.map((q) => {
    const fieldId = String(q?.id ?? q?.key ?? q?.name ?? "")
    const type = String(q?.type ?? "text")
    const raw = answers?.[fieldId]
    const isPhoto = PHOTO_TYPES.has(type)
    return {
      fieldId,
      label: normalizeText(String(q?.label ?? fieldId)),
      type,
      value: isPhoto ? null : raw ?? null,
      photoUrls: isPhoto ? toUrlArray(raw) : undefined,
    }
  })
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function fillDailyTrend(
  counts: Map<string, number>,
  from: Date,
  to: Date,
): Array<{ date: string; count: number }> {
  const out: Array<{ date: string; count: number }> = []
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))
  while (cursor <= end) {
    const key = isoDay(cursor)
    out.push({ date: key, count: counts.get(key) ?? 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

/** Push scope restriction onto a WHERE-condition list for reports aliased `r`. */
function pushScope(scope: ScopeContext, conditions: string[], params: any[]): void {
  if (scope.role === "admin") return
  if (!scope.teamIds || scope.teamIds.length === 0) {
    conditions.push("FALSE")
    return
  }
  params.push(scope.teamIds)
  conditions.push(`r.team_id = ANY($${params.length}::uuid[])`)
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

function buildReportConditions(scope: ScopeContext, filters: ReportFilters): { where: string; params: any[] } {
  const conditions: string[] = []
  const params: any[] = []

  // Viewing your own submissions ("My Records") bypasses team scope — you can always
  // see what you submitted, even from a team you've since left.
  const viewingOwn = filters.userId != null && Number(filters.userId) === scope.telegramId
  if (!viewingOwn) pushScope(scope, conditions, params)

  if (scope.role === "admin" && filters.teamId) {
    params.push(filters.teamId)
    conditions.push(`r.team_id = $${params.length}`)
  }
  if (filters.userId != null && Number.isFinite(filters.userId)) {
    params.push(filters.userId)
    conditions.push(`r.user_id = $${params.length}`)
  }
  if (filters.templateId) {
    params.push(filters.templateId)
    conditions.push(`r.template_id = $${params.length}`)
  }
  if (filters.from) {
    params.push(filters.from)
    conditions.push(`r.created_at >= $${params.length}`)
  }
  if (filters.to) {
    params.push(filters.to)
    conditions.push(`r.created_at <= $${params.length}`)
  }
  if (filters.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`)
    const i = params.length
    conditions.push(`(r.title ILIKE $${i} OR r.answers::text ILIKE $${i})`)
  }
  if (filters.submitter === "self") {
    params.push(scope.telegramId)
    conditions.push(`r.user_id = $${params.length}`)
  } else if (filters.submitter === "others") {
    params.push(scope.telegramId)
    conditions.push(`r.user_id <> $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  return { where, params }
}

const REPORT_SELECT = `
  SELECT r.id, r.user_id, r.team_id, r.template_id, r.title, r.answers, r.created_at, r.updated_at,
         u.first_name, u.last_name, u.username,
         t.name AS team_name,
         tp.name AS template_name, tp.is_student_tracker, tp.questions
  FROM reports r
  LEFT JOIN users u ON u.telegram_id = r.user_id
  LEFT JOIN teams t ON t.id = r.team_id
  LEFT JOIN templates tp ON tp.id = r.template_id`

function mapEnrichedRow(row: any): EnrichedReportRow {
  const answers = parseJson<Record<string, unknown>>(row.answers, {})
  const questions = parseJson<any[]>(row.questions, [])
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at ?? row.created_at).toISOString(),
    title: normalizeText(row.title ?? ""),
    user: {
      telegramId: Number(row.user_id),
      name: buildName(row.first_name, row.last_name) || (row.username ? `@${row.username}` : `#${row.user_id}`),
      username: row.username ?? undefined,
    },
    team: { id: row.team_id, name: normalizeText(row.team_name ?? "") },
    template: {
      id: row.template_id,
      name: normalizeText(row.template_name ?? ""),
      isStudentTracker: row.is_student_tracker ?? false,
    },
    answers,
    cells: buildCells(questions, answers),
  }
}

export async function getReportsFiltered(scope: ScopeContext, filters: ReportFilters): Promise<ReportsResult> {
  const { where, params } = buildReportConditions(scope, filters)

  const countResult = await runQuery<{ total: number }>(
    `SELECT count(*)::int AS total FROM reports r ${where}`,
    params,
  )
  const total = countResult.rows[0]?.total ?? 0

  const page = Math.max(1, Math.floor(filters.page ?? 1))
  const pageSize = Math.min(200, Math.max(1, Math.floor(filters.pageSize ?? 25)))
  const offset = (page - 1) * pageSize

  const pageParams = [...params, pageSize, offset]
  const rowsResult = await runQuery(
    `${REPORT_SELECT} ${where} ORDER BY r.created_at DESC LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
    pageParams,
  )

  return { rows: rowsResult.rows.map(mapEnrichedRow), total, page, pageSize }
}

/** All scoped+filtered reports (no pagination) — used for export. Capped to avoid runaway. */
export async function getReportsForExport(scope: ScopeContext, filters: ReportFilters, cap = 10000): Promise<EnrichedReportRow[]> {
  const { where, params } = buildReportConditions(scope, filters)
  const capped = [...params, cap]
  const result = await runQuery(`${REPORT_SELECT} ${where} ORDER BY r.created_at DESC LIMIT $${capped.length}`, capped)
  return result.rows.map(mapEnrichedRow)
}

// ---------------------------------------------------------------------------
// Summary KPIs
// ---------------------------------------------------------------------------

export async function getSummary(scope: ScopeContext): Promise<SummaryKpis> {
  const now = Date.now()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const last7 = new Date(now - 7 * DAY_MS)
  const last30 = new Date(now - 30 * DAY_MS)

  const conditions: string[] = []
  const params: any[] = []
  pushScope(scope, conditions, params)
  const scopeWhere = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  params.push(startOfToday.toISOString())
  const todayIdx = params.length
  params.push(last7.toISOString())
  const last7Idx = params.length
  params.push(last30.toISOString())
  const last30Idx = params.length

  const kpis = await runQuery<{
    total: number
    today: number
    last7: number
    last30: number
    submitters: number
  }>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE r.created_at >= $${todayIdx})::int AS today,
            count(*) FILTER (WHERE r.created_at >= $${last7Idx})::int AS last7,
            count(*) FILTER (WHERE r.created_at >= $${last30Idx})::int AS last30,
            count(DISTINCT r.user_id)::int AS submitters
     FROM reports r ${scopeWhere}`,
    params,
  )
  const k = kpis.rows[0] ?? { total: 0, today: 0, last7: 0, last30: 0, submitters: 0 }

  // teams + templates counts
  let teams = 0
  let templates = 0
  if (scope.role === "admin") {
    const t = await runQuery<{ teams: number; templates: number }>(
      `SELECT (SELECT count(*)::int FROM teams) AS teams, (SELECT count(*)::int FROM templates) AS templates`,
    )
    teams = t.rows[0]?.teams ?? 0
    templates = t.rows[0]?.templates ?? 0
  } else if (scope.teamIds && scope.teamIds.length > 0) {
    teams = scope.teamIds.length
    const t = await runQuery<{ templates: number }>(
      `SELECT count(DISTINCT template_id)::int AS templates FROM team_templates WHERE team_id = ANY($1::uuid[])`,
      [scope.teamIds],
    )
    templates = t.rows[0]?.templates ?? 0
  }

  // trend — rebuild conditions independently to keep parameter indexes clean
  const tConds: string[] = []
  const tParams: any[] = []
  pushScope(scope, tConds, tParams)
  tParams.push(last30.toISOString())
  tConds.push(`r.created_at >= $${tParams.length}`)
  const trend = await runQuery<{ d: string; c: number }>(
    `SELECT to_char(date_trunc('day', r.created_at), 'YYYY-MM-DD') AS d, count(*)::int AS c
     FROM reports r WHERE ${tConds.join(" AND ")} GROUP BY 1 ORDER BY 1`,
    tParams,
  )
  const trendMap = new Map<string, number>(trend.rows.map((row) => [row.d, row.c]))

  return {
    totalReports: k.total,
    reportsToday: k.today,
    reports7d: k.last7,
    reports30d: k.last30,
    activeSubmitters: k.submitters,
    teams,
    templates,
    trend: fillDailyTrend(trendMap, last30, new Date(now)),
  }
}

// ---------------------------------------------------------------------------
// Sheets (Google-Sheets-style per-template view)
// ---------------------------------------------------------------------------

export async function getSheets(scope: ScopeContext): Promise<SheetDescriptor[]> {
  if (scope.role === "admin") {
    const result = await runQuery<{ id: string; name: string; is_student_tracker: boolean; row_count: number }>(
      `SELECT tp.id, tp.name, tp.is_student_tracker, count(r.id)::int AS row_count
       FROM templates tp
       LEFT JOIN reports r ON r.template_id = tp.id
       GROUP BY tp.id, tp.name, tp.is_student_tracker
       ORDER BY tp.name`,
    )
    return result.rows.map((row) => ({
      templateId: row.id,
      name: normalizeText(row.name),
      isStudentTracker: row.is_student_tracker ?? false,
      rowCount: row.row_count,
    }))
  }

  if (!scope.teamIds || scope.teamIds.length === 0) return []
  const result = await runQuery<{ id: string; name: string; is_student_tracker: boolean; row_count: number }>(
    `SELECT tp.id, tp.name, tp.is_student_tracker,
            (SELECT count(*)::int FROM reports r WHERE r.template_id = tp.id AND r.team_id = ANY($1::uuid[])) AS row_count
     FROM templates tp
     WHERE tp.id IN (SELECT template_id FROM team_templates WHERE team_id = ANY($1::uuid[]))
     ORDER BY tp.name`,
    [scope.teamIds],
  )
  return result.rows.map((row) => ({
    templateId: row.id,
    name: normalizeText(row.name),
    isStudentTracker: row.is_student_tracker ?? false,
    rowCount: row.row_count,
  }))
}

export async function getSheetRows(
  scope: ScopeContext,
  templateId: string,
  filters: Pick<ReportFilters, "from" | "to"> = {},
): Promise<SheetData | null> {
  const tpl = await runQuery<{ id: string; name: string; is_student_tracker: boolean; questions: unknown }>(
    `SELECT id, name, is_student_tracker, questions FROM templates WHERE id = $1`,
    [templateId],
  )
  if (tpl.rows.length === 0) return null
  const template = tpl.rows[0]
  const questions = parseJson<any[]>(template.questions, [])

  const reports = await getReportsForExport(scope, { templateId, from: filters.from, to: filters.to })

  const baseColumns: SheetColumn[] = [
    { key: "_submittedAt", label: "Submitted At", type: "date", numeric: false },
    { key: "_team", label: "Team", type: "text", numeric: false },
    { key: "_user", label: "Submitted By", type: "text", numeric: false },
  ]
  const questionColumns: SheetColumn[] = questions.map((q) => {
    const type = String(q?.type ?? "text")
    return {
      key: String(q?.id ?? q?.key ?? q?.name ?? ""),
      label: normalizeText(String(q?.label ?? q?.id ?? "")),
      type,
      numeric: type === "number",
    }
  })
  const columns = [...baseColumns, ...questionColumns]

  const totals: Record<string, number> = {}
  const rows = reports.map((report) => {
    const row: Record<string, unknown> = {
      _submittedAt: report.createdAt,
      _team: report.team.name,
      _user: report.user.name,
    }
    for (const col of questionColumns) {
      const raw = report.answers[col.key]
      if (PHOTO_TYPES.has(col.type)) {
        row[col.key] = toUrlArray(raw)
      } else {
        row[col.key] = raw ?? null
        if (col.numeric) {
          const n = toNumeric(raw)
          if (n != null) totals[col.key] = (totals[col.key] ?? 0) + n
        }
      }
    }
    return row
  })

  return {
    templateId: template.id,
    name: normalizeText(template.name),
    isStudentTracker: template.is_student_tracker ?? false,
    columns,
    rows,
    totals,
  }
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getAnalytics(
  scope: ScopeContext,
  range: { from?: string; to?: string } = {},
): Promise<AnalyticsPayload> {
  const now = Date.now()
  const fromDate = range.from ? new Date(range.from) : new Date(now - 30 * DAY_MS)
  const toDate = range.to ? new Date(range.to) : new Date(now)

  function baseConds(): { conds: string[]; params: any[] } {
    const conds: string[] = []
    const params: any[] = []
    pushScope(scope, conds, params)
    params.push(fromDate.toISOString())
    conds.push(`r.created_at >= $${params.length}`)
    params.push(toDate.toISOString())
    conds.push(`r.created_at <= $${params.length}`)
    return { conds, params }
  }

  const trendQ = baseConds()
  const trend = await runQuery<{ d: string; c: number }>(
    `SELECT to_char(date_trunc('day', r.created_at), 'YYYY-MM-DD') AS d, count(*)::int AS c
     FROM reports r WHERE ${trendQ.conds.join(" AND ")} GROUP BY 1 ORDER BY 1`,
    trendQ.params,
  )
  const trendMap = new Map<string, number>(trend.rows.map((row) => [row.d, row.c]))

  const teamQ = baseConds()
  const perTeam = await runQuery<{ id: string; name: string; c: number }>(
    `SELECT t.id, t.name, count(*)::int AS c
     FROM reports r JOIN teams t ON t.id = r.team_id
     WHERE ${teamQ.conds.join(" AND ")} GROUP BY t.id, t.name ORDER BY c DESC`,
    teamQ.params,
  )

  const tplQ = baseConds()
  const perTemplate = await runQuery<{ id: string; name: string; c: number }>(
    `SELECT tp.id, tp.name, count(*)::int AS c
     FROM reports r JOIN templates tp ON tp.id = r.template_id
     WHERE ${tplQ.conds.join(" AND ")} GROUP BY tp.id, tp.name ORDER BY c DESC`,
    tplQ.params,
  )

  const lbQ = baseConds()
  const leaderboard = await runQuery<{ telegram_id: string | number; first_name: string; last_name: string | null; username: string | null; c: number }>(
    `SELECT u.telegram_id, u.first_name, u.last_name, u.username, count(*)::int AS c
     FROM reports r JOIN users u ON u.telegram_id = r.user_id
     WHERE ${lbQ.conds.join(" AND ")} GROUP BY u.telegram_id, u.first_name, u.last_name, u.username
     ORDER BY c DESC LIMIT 10`,
    lbQ.params,
  )

  // Student tracker course totals: sum numeric answers per question label across ST templates.
  const stQ = baseConds()
  const stReports = await runQuery<{ answers: unknown; questions: unknown }>(
    `SELECT r.answers, tp.questions
     FROM reports r JOIN templates tp ON tp.id = r.template_id
     WHERE ${stQ.conds.join(" AND ")} AND tp.is_student_tracker = TRUE`,
    stQ.params,
  )
  const courseTotals = new Map<string, number>()
  for (const row of stReports.rows) {
    const answers = parseJson<Record<string, unknown>>(row.answers, {})
    const questions = parseJson<any[]>(row.questions, [])
    for (const q of questions) {
      if (String(q?.type) !== "number") continue
      const fieldId = String(q?.id ?? q?.key ?? q?.name ?? "")
      const label = normalizeText(String(q?.label ?? fieldId))
      const n = toNumeric(answers[fieldId])
      if (n != null) courseTotals.set(label, (courseTotals.get(label) ?? 0) + n)
    }
  }

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString() },
    trend: fillDailyTrend(trendMap, fromDate, toDate),
    perTeam: perTeam.rows.map((row) => ({ teamId: row.id, name: normalizeText(row.name), count: row.c })),
    perTemplate: perTemplate.rows.map((row) => ({ templateId: row.id, name: normalizeText(row.name), count: row.c })),
    leaderboard: leaderboard.rows.map((row) => ({
      telegramId: Number(row.telegram_id),
      name: buildName(row.first_name, row.last_name) || (row.username ? `@${row.username}` : `#${row.telegram_id}`),
      count: row.c,
    })),
    studentTracker: Array.from(courseTotals.entries()).map(([course, total]) => ({ course, total })),
  }
}

// ---------------------------------------------------------------------------
// Filter option lists (for the dashboard filter bar)
// ---------------------------------------------------------------------------

export async function getFilterOptions(scope: ScopeContext): Promise<{
  teams: Array<{ id: string; name: string }>
  templates: Array<{ id: string; name: string }>
  users: Array<{ telegramId: number; name: string }>
}> {
  if (scope.role === "admin") {
    const [teams, templates, users] = await Promise.all([
      runQuery<{ id: string; name: string }>(`SELECT id, name FROM teams ORDER BY name`),
      runQuery<{ id: string; name: string }>(`SELECT id, name FROM templates ORDER BY name`),
      runQuery<{ telegram_id: string | number; first_name: string; last_name: string | null; username: string | null }>(
        `SELECT telegram_id, first_name, last_name, username FROM users ORDER BY first_name`,
      ),
    ])
    return {
      teams: teams.rows.map((r) => ({ id: r.id, name: normalizeText(r.name) })),
      templates: templates.rows.map((r) => ({ id: r.id, name: normalizeText(r.name) })),
      users: users.rows.map((r) => ({
        telegramId: Number(r.telegram_id),
        name: buildName(r.first_name, r.last_name) || (r.username ? `@${r.username}` : `#${r.telegram_id}`),
      })),
    }
  }

  if (!scope.teamIds || scope.teamIds.length === 0) return { teams: [], templates: [], users: [] }
  const [team, templates, users] = await Promise.all([
    runQuery<{ id: string; name: string }>(`SELECT id, name FROM teams WHERE id = ANY($1::uuid[])`, [scope.teamIds]),
    runQuery<{ id: string; name: string }>(
      `SELECT DISTINCT tp.id, tp.name FROM templates tp INNER JOIN team_templates tt ON tt.template_id = tp.id WHERE tt.team_id = ANY($1::uuid[]) ORDER BY tp.name`,
      [scope.teamIds],
    ),
    runQuery<{ telegram_id: string | number; first_name: string; last_name: string | null; username: string | null }>(
      `SELECT telegram_id, first_name, last_name, username FROM users WHERE team_id = ANY($1::uuid[]) ORDER BY first_name`,
      [scope.teamIds],
    ),
  ])
  return {
    teams: team.rows.map((r) => ({ id: r.id, name: normalizeText(r.name) })),
    templates: templates.rows.map((r) => ({ id: r.id, name: normalizeText(r.name) })),
    users: users.rows.map((r) => ({
      telegramId: Number(r.telegram_id),
      name: buildName(r.first_name, r.last_name) || (r.username ? `@${r.username}` : `#${r.telegram_id}`),
    })),
  }
}

// ---------------------------------------------------------------------------
// Teams (members + lead) — the dashboard "Team" page
// ---------------------------------------------------------------------------

export interface TeamMember {
  telegramId: number
  name: string
  username?: string
  role: string // free-text job title
  reportCount: number
  isLead: boolean
  isSelf: boolean
}

export interface TeamView {
  id: string
  name: string
  leadTelegramId: number | null
  leadName: string | null
  youLead: boolean
  members: TeamMember[]
}

export async function getTeams(scope: ScopeContext): Promise<TeamView[]> {
  let teamRows: Array<{ id: string; name: string; lead_telegram_id: string | number | null }>
  if (scope.role === "admin") {
    teamRows = (
      await runQuery<{ id: string; name: string; lead_telegram_id: string | number | null }>(
        `SELECT id, name, lead_telegram_id FROM teams ORDER BY name`,
      )
    ).rows
  } else {
    if (!scope.teamIds || scope.teamIds.length === 0) return []
    teamRows = (
      await runQuery<{ id: string; name: string; lead_telegram_id: string | number | null }>(
        `SELECT id, name, lead_telegram_id FROM teams WHERE id = ANY($1::uuid[]) ORDER BY name`,
        [scope.teamIds],
      )
    ).rows
  }

  const views: TeamView[] = []
  for (const t of teamRows) {
    const leadId = t.lead_telegram_id != null ? Number(t.lead_telegram_id) : null
    const members = await runQuery<{
      telegram_id: string | number
      first_name: string
      last_name: string | null
      username: string | null
      role: string
      report_count: number
    }>(
      `SELECT u.telegram_id, u.first_name, u.last_name, u.username, u.role,
              (SELECT count(*)::int FROM reports r WHERE r.user_id = u.telegram_id AND r.team_id = $1) AS report_count
       FROM users u WHERE u.team_id = $1 ORDER BY u.first_name`,
      [t.id],
    )
    const memberList: TeamMember[] = members.rows.map((m) => {
      const id = Number(m.telegram_id)
      return {
        telegramId: id,
        name: buildName(m.first_name, m.last_name) || (m.username ? `@${m.username}` : `#${id}`),
        username: m.username ?? undefined,
        role: normalizeText(m.role || ""),
        reportCount: m.report_count,
        isLead: leadId != null && leadId === id,
        isSelf: id === scope.telegramId,
      }
    })
    const leadMember = memberList.find((m) => m.isLead)
    views.push({
      id: t.id,
      name: normalizeText(t.name),
      leadTelegramId: leadId,
      leadName: leadMember?.name ?? null,
      youLead: leadId != null && leadId === scope.telegramId,
      members: memberList,
    })
  }
  return views
}
