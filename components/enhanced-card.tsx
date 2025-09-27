"use client"

import type { ReactNode } from "react"
import { Card, type CardProps } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EnhancedCardProps extends CardProps {
  children: ReactNode
  hover?: boolean
  glass?: boolean
  glow?: boolean
  animate?: "slide-up" | "slide-down" | "slide-left" | "slide-right" | "none"
}

export default function EnhancedCard({
  children,
  className,
  hover = true,
  glass = false,
  glow = false,
  animate = "slide-up",
  ...props
}: EnhancedCardProps) {
  return (
    <Card
      className={cn(
        "border-1 border-white/20",
        hover && "card-hover",
        glass && "glass",
        glow && "ring-1 ring-primary/20",
        animate === "slide-up" && "animate-slide-in-up",
        animate === "slide-down" && "animate-slide-in-down",
        animate === "slide-left" && "animate-slide-in-left",
        animate === "slide-right" && "animate-slide-in-right",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
