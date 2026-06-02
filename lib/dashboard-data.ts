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
  range: { from: string; to: string; days: number }
  kpis: {
    total: number
    totalPrev: number
    totalDeltaPct: number | null
    activeSubmitters: number
    activeSubmittersPrev: number
    avgPerDay: number
    withPhotos: number
    withPhotosPct: number
    edited: number
    editedPct: number
    coverage: { members: number; submitted: number; pct: number }
    busiestDay: { date: string; count: number } | null
    peakHour: { hour: number; count: number } | null
  }
  trend: Array<{ date: string; count: number }>
  dow: Array<{ name: string; count: number }>
  hours: Array<{ name: string; count: number }>
  heatmap: Array<{ dow: number; hour: number; count: number }>
  perTeam: Array<{ teamId: string; name: string; count: number; members: number; avgPerMember: number }>
  perTemplate: Array<{ templateId: string; name: string; count: number; pct: number }>
  leaderboard: Array<{ telegramId: number; name: string; count: number }>
  inactiveMembers: Array<{ telegramId: number; name: string; team: string }>
  numericInsights: Array<{
    templateId: string
    templateName: string
    reports: number
    fields: Array<{ label: string; sum: number; avg: number; count: number }>
  }>
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

const TZ = "Asia/Tashkent"
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun for display

export async function getAnalytics(
  scope: ScopeContext,
  range: { from?: string; to?: string } = {},
): Promise<AnalyticsPayload> {
  const now = Date.now()
  const toDate = range.to ? new Date(range.to) : new Date(now)
  const fromDate = range.from ? new Date(range.from) : new Date(now - 30 * DAY_MS)
  const spanMs = Math.max(DAY_MS, toDate.getTime() - fromDate.getTime())
  const days = Math.max(1, Math.round(spanMs / DAY_MS))
  const prevFrom = new Date(fromDate.getTime() - spanMs)

  // reports WHERE for an arbitrary [from, to] window (with scope)
  const windowConds = (from: Date, to: Date) => {
    const conds: string[] = []
    const params: any[] = []
    pushScope(scope, conds, params)
    params.push(from.toISOString())
    conds.push(`r.created_at >= $${params.length}`)
    params.push(to.toISOString())
    conds.push(`r.created_at <= $${params.length}`)
    return { where: conds.join(" AND "), params }
  }
  const cur = windowConds(fromDate, toDate)
  const prev = windowConds(prevFrom, fromDate)

  // members in scope (for coverage / inactive)
  const mscope =
    scope.role === "admin"
      ? { where: "u.team_id IS NOT NULL", params: [] as any[] }
      : !scope.teamIds || scope.teamIds.length === 0
        ? { where: "FALSE", params: [] as any[] }
        : { where: "u.team_id = ANY($1::uuid[])", params: [scope.teamIds] as any[] }
  const memberParams = [...mscope.params, fromDate.toISOString(), toDate.toISOString()]
  const mFromIdx = mscope.params.length + 1
  const mToIdx = mscope.params.length + 2

  const [kpiR, prevR, trendR, dowR, hourR, heatR, teamR, memberCountR, tmplR, lbR, memberR, numericR] =
    await Promise.all([
      runQuery<{ total: number; submitters: number; with_photos: number; edited: number }>(
        `SELECT count(*)::int AS total, count(DISTINCT r.user_id)::int AS submitters,
                count(*) FILTER (WHERE r.answers::text ILIKE '%/api/uploads/%')::int AS with_photos,
                count(*) FILTER (WHERE r.updated_at > r.created_at + interval '5 seconds')::int AS edited
         FROM reports r WHERE ${cur.where}`,
        cur.params,
      ),
      runQuery<{ total: number; submitters: number }>(
        `SELECT count(*)::int AS total, count(DISTINCT r.user_id)::int AS submitters FROM reports r WHERE ${prev.where}`,
        prev.params,
      ),
      runQuery<{ d: string; c: number }>(
        `SELECT to_char(date_trunc('day', r.created_at), 'YYYY-MM-DD') AS d, count(*)::int AS c
         FROM reports r WHERE ${cur.where} GROUP BY 1 ORDER BY 1`,
        cur.params,
      ),
      runQuery<{ dow: number; c: number }>(
        `SELECT EXTRACT(DOW FROM r.created_at AT TIME ZONE '${TZ}')::int AS dow, count(*)::int AS c
         FROM reports r WHERE ${cur.where} GROUP BY 1`,
        cur.params,
      ),
      runQuery<{ hour: number; c: number }>(
        `SELECT EXTRACT(HOUR FROM r.created_at AT TIME ZONE '${TZ}')::int AS hour, count(*)::int AS c
         FROM reports r WHERE ${cur.where} GROUP BY 1`,
        cur.params,
      ),
      runQuery<{ dow: number; hour: number; c: number }>(
        `SELECT EXTRACT(DOW FROM r.created_at AT TIME ZONE '${TZ}')::int AS dow,
                EXTRACT(HOUR FROM r.created_at AT TIME ZONE '${TZ}')::int AS hour, count(*)::int AS c
         FROM reports r WHERE ${cur.where} GROUP BY 1, 2`,
        cur.params,
      ),
      runQuery<{ id: string; name: string; c: number }>(
        `SELECT t.id, t.name, count(*)::int AS c FROM reports r JOIN teams t ON t.id = r.team_id
         WHERE ${cur.where} GROUP BY t.id, t.name ORDER BY c DESC`,
        cur.params,
      ),
      runQuery<{ team_id: string; n: number }>(
        `SELECT team_id, count(*)::int AS n FROM users WHERE team_id IS NOT NULL GROUP BY team_id`,
      ),
      runQuery<{ id: string; name: string; c: number }>(
        `SELECT tp.id, tp.name, count(*)::int AS c FROM reports r JOIN templates tp ON tp.id = r.template_id
         WHERE ${cur.where} GROUP BY tp.id, tp.name ORDER BY c DESC`,
        cur.params,
      ),
      runQuery<{ telegram_id: string | number; first_name: string; last_name: string | null; username: string | null; c: number }>(
        `SELECT u.telegram_id, u.first_name, u.last_name, u.username, count(*)::int AS c
         FROM reports r JOIN users u ON u.telegram_id = r.user_id
         WHERE ${cur.where} GROUP BY u.telegram_id, u.first_name, u.last_name, u.username ORDER BY c DESC LIMIT 12`,
        cur.params,
      ),
      runQuery<{ telegram_id: string | number; first_name: string; last_name: string | null; username: string | null; team_name: string | null; cnt: number }>(
        `SELECT u.telegram_id, u.first_name, u.last_name, u.username, t.name AS team_name,
                (SELECT count(*)::int FROM reports r WHERE r.user_id = u.telegram_id
                   AND r.created_at >= $${mFromIdx} AND r.created_at <= $${mToIdx}) AS cnt
         FROM users u LEFT JOIN teams t ON t.id = u.team_id
         WHERE ${mscope.where} ORDER BY u.first_name`,
        memberParams,
      ),
      runQuery<{ answers: unknown; tpl_id: string; tpl_name: string; questions: unknown }>(
        `SELECT r.answers, tp.id AS tpl_id, tp.name AS tpl_name, tp.questions
         FROM reports r JOIN templates tp ON tp.id = r.template_id WHERE ${cur.where}`,
        cur.params,
      ),
    ])

  const k = kpiR.rows[0] ?? { total: 0, submitters: 0, with_photos: 0, edited: 0 }
  const kPrev = prevR.rows[0] ?? { total: 0, submitters: 0 }

  // trend (UTC days, gap-filled)
  const trendMap = new Map<string, number>(trendR.rows.map((row) => [row.d, row.c]))
  const trend = fillDailyTrend(trendMap, fromDate, toDate)
  const busiest = trend.reduce<{ date: string; count: number } | null>(
    (best, d) => (best == null || d.count > best.count ? { date: d.date, count: d.count } : best),
    null,
  )

  // day-of-week (Mon..Sun)
  const dowMap = new Map<number, number>(dowR.rows.map((r) => [r.dow, r.c]))
  const dow = DOW_ORDER.map((i) => ({ name: DOW_LABELS[i], count: dowMap.get(i) ?? 0 }))

  // hour-of-day (0..23)
  const hourMap = new Map<number, number>(hourR.rows.map((r) => [r.hour, r.c]))
  const hours = Array.from({ length: 24 }, (_, h) => ({ name: `${String(h).padStart(2, "0")}`, count: hourMap.get(h) ?? 0 }))
  const peakHour = hourR.rows.reduce<{ hour: number; count: number } | null>(
    (best, r) => (best == null || r.c > best.count ? { hour: r.hour, count: r.c } : best),
    null,
  )

  const heatmap = heatR.rows.map((r) => ({ dow: r.dow, hour: r.hour, count: r.c }))

  // per-team with member counts + avg
  const memberCounts = new Map<string, number>(memberCountR.rows.map((r) => [r.team_id, r.n]))
  const perTeam = teamR.rows.map((row) => {
    const members = memberCounts.get(row.id) ?? 0
    return {
      teamId: row.id,
      name: normalizeText(row.name),
      count: row.c,
      members,
      avgPerMember: members > 0 ? Math.round((row.c / members) * 10) / 10 : 0,
    }
  })

  const perTemplate = tmplR.rows.map((row) => ({
    templateId: row.id,
    name: normalizeText(row.name),
    count: row.c,
    pct: k.total > 0 ? Math.round((row.c / k.total) * 1000) / 10 : 0,
  }))

  const leaderboard = lbR.rows.map((row) => ({
    telegramId: Number(row.telegram_id),
    name: buildName(row.first_name, row.last_name) || (row.username ? `@${row.username}` : `#${row.telegram_id}`),
    count: row.c,
  }))

  // coverage + inactive members
  const members = memberR.rows
  const submitted = members.filter((m) => m.cnt > 0).length
  const inactiveMembers = members
    .filter((m) => m.cnt === 0)
    .map((m) => ({
      telegramId: Number(m.telegram_id),
      name: buildName(m.first_name, m.last_name) || (m.username ? `@${m.username}` : `#${m.telegram_id}`),
      team: normalizeText(m.team_name ?? ""),
    }))

  // numeric insights — sum/avg of numeric answer fields per template (the "hidden" data)
  const numericAgg = new Map<
    string,
    { name: string; reports: number; fields: Map<string, { sum: number; count: number }> }
  >()
  for (const row of numericR.rows) {
    const answers = parseJson<Record<string, unknown>>(row.answers, {})
    const questions = parseJson<any[]>(row.questions, [])
    let entry = numericAgg.get(row.tpl_id)
    if (!entry) {
      entry = { name: normalizeText(row.tpl_name || ""), reports: 0, fields: new Map() }
      numericAgg.set(row.tpl_id, entry)
    }
    entry.reports += 1
    for (const q of questions) {
      if (String(q?.type) !== "number") continue
      const fieldId = String(q?.id ?? q?.key ?? q?.name ?? "")
      const label = normalizeText(String(q?.label ?? fieldId))
      const n = toNumeric(answers[fieldId])
      if (n == null) continue
      const f = entry.fields.get(label) ?? { sum: 0, count: 0 }
      f.sum += n
      f.count += 1
      entry.fields.set(label, f)
    }
  }
  const numericInsights = Array.from(numericAgg.entries())
    .map(([templateId, entry]) => ({
      templateId,
      templateName: entry.name,
      reports: entry.reports,
      fields: Array.from(entry.fields.entries())
        .map(([label, f]) => ({ label, sum: f.sum, avg: Math.round((f.sum / f.count) * 100) / 100, count: f.count }))
        .sort((a, b) => b.sum - a.sum),
    }))
    .filter((t) => t.fields.length > 0)
    .sort((a, b) => b.reports - a.reports)

  const memberTotal = members.length

  return {
    range: { from: fromDate.toISOString(), to: toDate.toISOString(), days },
    kpis: {
      total: k.total,
      totalPrev: kPrev.total,
      totalDeltaPct: kPrev.total > 0 ? Math.round(((k.total - kPrev.total) / kPrev.total) * 1000) / 10 : null,
      activeSubmitters: k.submitters,
      activeSubmittersPrev: kPrev.submitters,
      avgPerDay: Math.round((k.total / days) * 10) / 10,
      withPhotos: k.with_photos,
      withPhotosPct: k.total > 0 ? Math.round((k.with_photos / k.total) * 1000) / 10 : 0,
      edited: k.edited,
      editedPct: k.total > 0 ? Math.round((k.edited / k.total) * 1000) / 10 : 0,
      coverage: { members: memberTotal, submitted, pct: memberTotal > 0 ? Math.round((submitted / memberTotal) * 1000) / 10 : 0 },
      busiestDay: busiest && busiest.count > 0 ? busiest : null,
      peakHour: peakHour && peakHour.count > 0 ? peakHour : null,
    },
    trend,
    dow,
    hours,
    heatmap,
    perTeam,
    perTemplate,
    leaderboard,
    inactiveMembers,
    numericInsights,
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
