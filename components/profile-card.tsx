"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import StatusBadge from "@/components/status-badge"
import { getTeamById } from "@/lib/database"

export default function ProfileCard() {
  const { telegramUser, dbUser, isAdmin } = useAuthContext()
  const [isLoaded, setIsLoaded] = useState(false)
  const [teamName, setTeamName] = useState<string>("")

  useEffect(() => {
    if (telegramUser) {
      setIsLoaded(true)
    }
  }, [telegramUser])

  useEffect(() => {
    const fetchTeamName = async () => {
      if (dbUser?.teamId && !isAdmin) {
        try {
          const team = await getTeamById(dbUser.teamId)
          if (team?.name) {
            setTeamName(team.name)
          }
        } catch (error) {
          console.error("Failed to fetch team name:", error)
          setTeamName("Unknown Team")
        }
      }
    }

    fetchTeamName()
  }, [dbUser?.teamId, isAdmin])

  if (!telegramUser) return null

  const displayName = telegramUser.first_name || telegramUser.username || "User"
  const role = isAdmin ? "Admin" : dbUser?.role || "Unknown"
  const team = isAdmin ? "Administration" : teamName || "Unassigned"
  const usernameDisplay = telegramUser.username ? `@${telegramUser.username}` : ""

  return (
    <div className="mx-4 mb-2">
      <div
        className={`border border-border bg-card shadow-sm rounded-xl transition-all duration-300 ease-out ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Avatar with status */}
          <div className="relative">
            <Avatar className="h-9 w-9 ring-1 ring-white/20">
              <AvatarImage src={telegramUser.photo_url || "/placeholder.svg"} alt={displayName} />
              <AvatarFallback className="bg-telegram-blue text-white font-medium text-sm">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border border-card" />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            {/* Name + Role */}
            <div className="flex items-center gap-2">
              <p className="text-base font-medium text-foreground truncate">{displayName}</p>
              <StatusBadge
                status={role === "Admin" ? "online" : "away"}
                showIndicator
                className="text-xs bg-telegram-blue/60 text-white border-0"
              >
                {role}
              </StatusBadge>
            </div>

            {/* Username + Team (inline) */}
            <div className="flex items-center gap-1 truncate">
              {usernameDisplay && <p className="text-sm font-medium text-foregound truncate">{usernameDisplay}</p>}
              <p className="text-sm text-muted-foreground truncate">{team}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
