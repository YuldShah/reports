"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

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
          const response = await fetch(`/api/teams?id=${dbUser.teamId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.team?.name) {
              setTeamName(data.team.name)
            } else {
              setTeamName("Unknown Team")
            }
          } else {
            setTeamName("Unknown Team")
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
        className={`rounded-xl transition-all duration-500 ease-out ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="flex items-center gap-3 px-1 py-1.5">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-9 w-9 ring-1 ring-white/10">
              <AvatarImage src={telegramUser.photo_url || "/placeholder.svg"} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary font-heading font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full ring-2 ring-background" />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                {role}
              </span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              {usernameDisplay && (
                <span className="text-xs text-muted-foreground/80 truncate">{usernameDisplay}</span>
              )}
              {usernameDisplay && <span className="text-muted-foreground/30 text-xs">·</span>}
              <span className="text-xs text-muted-foreground truncate">{team}</span>
            </div>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
