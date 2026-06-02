"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { DashSelect } from "@/components/dashboard/select"

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
  const hasFilters = !!(value.teamId || value.templateId || value.userId || value.from || value.to || value.search)
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
            className="surface-field h-9 w-full rounded-[calc(var(--radius)+2px)] border pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {showTeamSelect && (
          <DashSelect
            ariaLabel="Filter by team"
            className="min-w-[150px]"
            value={value.teamId ?? ""}
            onValueChange={(v) => set({ teamId: v || undefined })}
            allLabel="All teams"
            options={options.teams.map((t) => ({ value: t.id, label: t.name }))}
          />
        )}

        {showTemplate && (
          <DashSelect
            ariaLabel="Filter by template"
            className="min-w-[150px]"
            value={value.templateId ?? ""}
            onValueChange={(v) => set({ templateId: v || undefined })}
            allLabel="All templates"
            options={options.templates.map((t) => ({ value: t.id, label: t.name }))}
          />
        )}

        {showUser && (
          <DashSelect
            ariaLabel="Filter by person"
            className="min-w-[150px]"
            value={value.userId ?? ""}
            onValueChange={(v) => set({ userId: v || undefined })}
            allLabel="All people"
            options={options.users.map((u) => ({ value: String(u.telegramId), label: u.name }))}
          />
        )}

        <div className="w-36">
          <DatePicker value={value.from} onChange={(v) => set({ from: v || undefined })} placeholder="From" />
        </div>
        <div className="w-36">
          <DatePicker value={value.to} onChange={(v) => set({ to: v || undefined })} placeholder="To" />
        </div>

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
