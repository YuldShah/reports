"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ReportFiltersState {
  teamId?: string
  templateId?: string
  userId?: string
  from?: string
  to?: string
  search?: string
}

interface FilterOptions {
  teams: Array<{ id: string; name: string }>
  templates: Array<{ id: string; name: string }>
  users: Array<{ telegramId: number; name: string }>
}

interface FiltersBarProps {
  value: ReportFiltersState
  onChange: (next: ReportFiltersState) => void
  showTeam?: boolean
  showUser?: boolean
  showTemplate?: boolean
}

const fieldClass =
  "surface-field h-9 min-w-0 rounded-[calc(var(--radius)+2px)] border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

export function FiltersBar({
  value,
  onChange,
  showTeam = true,
  showUser = true,
  showTemplate = true,
}: FiltersBarProps) {
  const [options, setOptions] = useState<FilterOptions>({ teams: [], templates: [], users: [] })
  const [search, setSearch] = useState(value.search ?? "")

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    fetch("/api/dashboard/filters")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setOptions(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      onChangeRef.current({ ...valueRef.current, search: search.trim() || undefined })
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const set = (patch: Partial<ReportFiltersState>) => onChange({ ...value, ...patch })
  const hasFilters =
    !!(value.teamId || value.templateId || value.userId || value.from || value.to || value.search)

  const showTeamSelect = showTeam && options.teams.length > 1

  return (
    <div className="surface-panel rounded-[calc(var(--radius)+4px)] border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or answers…"
            className={`${fieldClass} w-full pl-9`}
          />
        </div>

        {showTeamSelect && (
          <select className={fieldClass} value={value.teamId ?? ""} onChange={(e) => set({ teamId: e.target.value || undefined })}>
            <option value="">All teams</option>
            {options.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {showTemplate && (
          <select
            className={fieldClass}
            value={value.templateId ?? ""}
            onChange={(e) => set({ templateId: e.target.value || undefined })}
          >
            <option value="">All templates</option>
            {options.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {showUser && (
          <select className={fieldClass} value={value.userId ?? ""} onChange={(e) => set({ userId: e.target.value || undefined })}>
            <option value="">All people</option>
            {options.users.map((u) => (
              <option key={u.telegramId} value={String(u.telegramId)}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        <input type="date" className={fieldClass} value={value.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })} aria-label="From date" />
        <input type="date" className={fieldClass} value={value.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })} aria-label="To date" />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
              onChange({})
            }}
          >
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  )
}
