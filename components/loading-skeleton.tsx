import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  avatar?: boolean
}

export default function LoadingSkeleton({ className, lines = 3, avatar = false }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {avatar && (
        <div className="flex items-center space-x-3">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-3 w-1/4 rounded" />
          </div>
        </div>
      )}

      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-4 w-full rounded" />
          {i === lines - 1 && <div className="skeleton h-4 w-2/3 rounded" />}
        </div>
      ))}
    </div>
  )
}
