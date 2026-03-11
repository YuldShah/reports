import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp } from "lucide-react"
import AnimatedCounter from "@/components/animated-counter"
// Note: Removed import EnhancedCard as we are now using the standard Card

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
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered employees",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Teams",
      value: stats.totalTeams,
      icon: TrendingUp,
      description: "Operational teams",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Reports",
      value: stats.totalReports,
      icon: FileText,
      description: "All time reports",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          // Replaced EnhancedCard with the standard Card component
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">
                <AnimatedCounter value={stat.value} duration={1000 + index * 200} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
            {/* The custom colored edge div was removed */}
          </Card>
        )
      })}
    </div>
  )
}
