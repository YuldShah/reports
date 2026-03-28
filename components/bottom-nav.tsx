"use client"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface BottomNavItem {
  id: string
  label: string
  icon: LucideIcon
  active?: boolean
  onClick: () => void
}

interface BottomNavProps {
  items: BottomNavItem[]
}

export default function BottomNav({ items }: BottomNavProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1rem+var(--tg-safe-area-inset-bottom,0px))]">
      <nav className="pointer-events-auto mx-auto flex max-w-[560px] items-center justify-between rounded-[32px] border border-glass-border/80 bg-background/84 px-3 py-3 shadow-[0_22px_52px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[24px] px-2 py-2 text-[11px] font-medium transition-[color,background-color,transform]",
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}