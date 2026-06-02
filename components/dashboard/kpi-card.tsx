import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  hint?: string
  /** Period-over-period change in %. Positive = up (green), negative = down (red). */
  delta?: number | null
  className?: string
}

export function KpiCard({ label, value, icon: Icon, hint, delta, className }: KpiCardProps) {
  const hasDelta = delta != null && Number.isFinite(delta)
  const up = (delta ?? 0) >= 0
  return (
    <div className={cn("surface-panel card-interactive rounded-[calc(var(--radius)+4px)] border p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-heading text-2xl font-bold tracking-tight tabular-nums">{value}</span>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta as number)}%
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
