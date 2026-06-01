// Client-safe helpers shared by the dashboard pages. No server imports.

export interface DashboardFilterValues {
  teamId?: string
  templateId?: string
  userId?: string | number
  from?: string
  to?: string
  search?: string
}

/** Convert UI filter state into API query params, expanding `to` to end-of-day. */
export function filtersToParams(filters: DashboardFilterValues): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.teamId) params.teamId = filters.teamId
  if (filters.templateId) params.templateId = filters.templateId
  if (filters.userId != null && filters.userId !== "") params.userId = String(filters.userId)
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = `${filters.to}T23:59:59.999`
  if (filters.search) params.search = filters.search
  return params
}
