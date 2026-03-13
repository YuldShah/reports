"use client"

import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

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
      <nav className="pointer-events-auto mx-auto flex max-w-[560px] items-center justify-between rounded-[32px] border border-glass-border/80 bg-background/84 px-2 py-2 shadow-lg backdrop-blur-2xl">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.active

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[24px] px-2 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-[24px] bg-primary/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-5 w-5 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="relative z-10 truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
