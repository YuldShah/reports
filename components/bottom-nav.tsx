"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

export default function BottomNav({ items }: BottomNavProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.7rem+var(--tg-safe-area-inset-bottom,0px))]">
      <nav
        className="glass-floating pointer-events-auto mx-auto grid max-w-[580px] items-center rounded-[26px] px-1.5 py-1.5"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 text-[12px] font-medium tracking-[0.01em] transition-colors active:scale-[0.98]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-[20px] border border-primary/15 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className="relative z-10 h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]"
                strokeWidth={2.2}
              />
              <span className="relative z-10 truncate text-[10px] font-semibold leading-none sm:text-[11px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
