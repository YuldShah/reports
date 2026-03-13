"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProfileCard() {
  const { telegramUser, dbUser, isAdmin, isBrowserDebug } = useAuthContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const [teamName, setTeamName] = useState<string>("");

  useEffect(() => {
    if (telegramUser) {
      setIsLoaded(true);
    }
  }, [telegramUser]);

  useEffect(() => {
    const fetchTeamName = async () => {
      if (dbUser?.teamId && !isAdmin) {
        try {
          const response = await fetch(`/api/teams?id=${dbUser.teamId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.team?.name) {
              setTeamName(data.team.name);
            } else {
              setTeamName("Unknown Team");
            }
          } else {
            setTeamName("Unknown Team");
          }
        } catch (error) {
          console.error("Failed to fetch team name:", error);
          setTeamName("Unknown Team");
        }
      }
    };

    fetchTeamName();
  }, [dbUser?.teamId, isAdmin]);

  if (!telegramUser) return null;

  const displayName =
    telegramUser.first_name || telegramUser.username || "User";
  const role = isAdmin ? "Admin" : dbUser?.role || "Unknown";
  const team = isAdmin ? "Administration" : teamName || "Unassigned";
  const usernameDisplay = telegramUser.username
    ? `@${telegramUser.username}`
    : "";

  return (
    <div className="mx-1 mb-0.5">
      <div
        className={`transition-all duration-500 ease-out ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="glass-floating flex items-center gap-3 rounded-[26px] px-3.5 py-2.5 sm:px-4 sm:py-3">
          <div className="shrink-0">
            <Avatar className="h-11 w-11 ring-1 ring-white/15 shadow-sm">
              <AvatarImage
                src={telegramUser.photo_url || "/placeholder.svg"}
                alt={displayName}
              />
              <AvatarFallback className="bg-primary/20 text-primary font-heading text-base font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <p className="truncate text-[15px] font-semibold leading-none text-foreground sm:text-base">
                {displayName}
              </p>
              <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary sm:text-[11px]">
                {role}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 truncate">
              {usernameDisplay && (
                <span className="truncate text-[12px] font-medium text-muted-foreground/90 sm:text-[13px]">
                  {usernameDisplay}
                </span>
              )}
              {usernameDisplay && (
                <span className="text-[11px] text-muted-foreground/40">·</span>
              )}
              <span className="truncate text-[12px] text-muted-foreground sm:text-[13px]">
                {team}
              </span>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
