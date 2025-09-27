import { Badge, type BadgeProps } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "online" | "away" | "offline" | "pending" | "in-progress" | "completed" | "high" | "medium" | "low"
  showIndicator?: boolean
}

export default function StatusBadge({
  status,
  showIndicator = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status) {
      case "online":
      case "completed":
        return "default"
      case "away":
      case "in-progress":
      case "medium":
        return "secondary"
      case "offline":
      case "pending":
      case "low":
        return "outline"
      case "high":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getIndicatorClass = (status: string) => {
    switch (status) {
      case "online":
      case "completed":
        return "online"
      case "away":
      case "in-progress":
      case "medium":
        return "away"
      case "offline":
      case "pending":
      case "low":
        return "offline"
      default:
        return "offline"
    }
  }

  return (
    <Badge
      variant={getVariant(status)}
      className={cn(showIndicator && "status-indicator", showIndicator && getIndicatorClass(status), className)}
      {...props}
    >
      {children || status}
    </Badge>
  )
}
