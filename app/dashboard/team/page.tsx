"use client"

import { useEffect, useState } from "react"
import { Crown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CenterSpinner, EmptyPanel, ErrorPanel } from "@/components/dashboard/states"
import type { TeamView } from "@/lib/dashboard-data"

export default function TeamPage() {
  const [teams, setTeams] = useState<TeamView[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard/team")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTeams(d.teams ?? []))
      .catch(() => setError(true))
  }, [])

  if (error) return <ErrorPanel />
  if (teams === null) return <CenterSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">Members and their activity.</p>
      </div>

      {teams.length === 0 ? (
        <EmptyPanel message="You're not assigned to a team yet." />
      ) : (
        teams.map((team) => (
          <Card key={team.id} className="surface-panel">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 font-heading text-base">
                <span>{team.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {team.members.length} {team.members.length === 1 ? "member" : "members"}
                  {team.leadName ? ` · Lead: ${team.leadName}` : " · no lead assigned"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-[calc(var(--radius)+2px)] border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Reports</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.members.map((m) => (
                      <TableRow key={m.telegramId} className="h-11">
                        <TableCell className="font-medium">
                          <span className="flex flex-wrap items-center gap-2">
                            {m.name}
                            {m.isLead && (
                              <Badge variant="default" className="gap-1">
                                <Crown className="h-3 w-3" /> Lead
                              </Badge>
                            )}
                            {m.isSelf && <Badge variant="outline">You</Badge>}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.role || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.reportCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
