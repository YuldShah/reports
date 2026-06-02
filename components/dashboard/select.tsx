"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashSelectOption {
  value: string
  label: string
}

const ALL = "__ALL__"

interface DashSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: DashSelectOption[]
  placeholder?: string
  /** When provided, a leading "all/none" option is shown that maps to "" */
  allLabel?: string
  className?: string
  ariaLabel?: string
}

/** Desktop dropdown select (Radix popover) — replaces native <select>. */
export function DashSelect({ value, onValueChange, options, placeholder, allLabel, className, ariaLabel }: DashSelectProps) {
  const current = value && value.length > 0 ? value : allLabel ? ALL : undefined

  return (
    <SelectPrimitive.Root value={current} onValueChange={(v) => onValueChange(v === ALL ? "" : v)}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "surface-field inline-flex h-9 items-center justify-between gap-2 rounded-[calc(var(--radius)+2px)] border px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring/50 data-[placeholder]:text-muted-foreground/80",
          className,
        )}
      >
        <span className="truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[120] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <SelectPrimitive.Viewport className="max-h-72 overflow-y-auto p-1">
            {allLabel && <DashItem value={ALL}>{allLabel}</DashItem>}
            {options.map((o) => (
              <DashItem key={o.value} value={o.value}>
                {o.label}
              </DashItem>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

function DashItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:font-medium"
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex">
        <Check className="h-4 w-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
