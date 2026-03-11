import { Card, CardContent } from "@/components/ui/card"
import { Users, FileText, TrendingUp } from "lucide-react"
import AnimatedCounter from "@/components/animated-counter"

interface OverviewStatsProps {
  stats: {
    totalUsers: number
    totalTeams: number
    totalReports: number
  }
}

export default function OverviewStats({ stats }: OverviewStatsProps) {
  const statCards = [
    {
      title: "Users",
      value: stats.totalUsers,
      icon: Users,
      accent: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Teams",
      value: stats.totalTeams,
      icon: TrendingUp,
      accent: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Reports",
      value: stats.totalReports,
      icon: FileText,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 stagger-children">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="glass border-glass-border overflow-hidden">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${stat.accent}`} />
              </div>
              <div className="font-heading text-2xl font-bold tracking-tight">
                <AnimatedCounter value={stat.value} duration={1000 + index * 200} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
