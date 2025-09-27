"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Users, UserPlus, Trash2, Building } from "lucide-react"
import { type User, type Team } from "@/lib/database"
import { toast } from "@/hooks/use-toast"

interface TeamManagementProps {
  onDataChange?: () => void
}

export default function TeamManagement({ onDataChange }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [newTeam, setNewTeam] = useState({ name: "", description: "" })
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch teams
      const teamsResponse = await fetch('/api/teams')
      const teamsData = await teamsResponse.json()
      setTeams(teamsData.teams || [])

      // Fetch users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeam.name,
          description: newTeam.description,
          createdBy: 6520664733, // Admin ID
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create team')
      }

      const data = await response.json()
      setTeams([...teams, data.team])
      setNewTeam({ name: "", description: "" })
      setIsCreateDialogOpen(false)

      toast({
        title: "Success",
        description: "Team created successfully",
        duration: 3000,
      })

      // Notify parent to refresh data
      onDataChange?.()
    } catch (error) {
      console.error('Error creating team:', error)
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
        duration: 3000,
      })
  const handleAddMember = async () => {
    if (!selectedUserId || !selectedTeam) return

    try {
      const userId = Number.parseInt(selectedUserId)
      const response = await fetch(`/api/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: userId,
          teamId: selectedTeam,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add member to team')
      }

      // Refresh local data
      await fetchData()
      setSelectedUserId("")
      setIsAddMemberDialogOpen(false)

      toast({
        title: "Success",
        description: "Member added to team successfully",
        duration: 3000,
      })

      // Notify parent to refresh data
      onDataChange?.()
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: "Error",
        description: "Failed to add member to team",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      const response = await fetch(`/api/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: userId,
          teamId: null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove member from team')
      }

      // Refresh local data
      await fetchData()

      toast({
        title: "Success",
        description: "Member removed from team",
        duration: 3000,
      })

      // Notify parent to refresh data
      onDataChange?.()
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Error",
        description: "Failed to remove member from team",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const unassignedUsers = users.filter((user) => !user.teamId && user.role !== "admin")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold">Team Management</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Management</h2>
          <p className="text-sm text-muted-foreground">Create teams and manage team members</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>Add a new team to organize your employees</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="e.g., Development Team"
                />
              </div>
              <div>
                <Label htmlFor="team-description">Description (Optional)</Label>
                <Textarea
                  id="team-description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Brief description of the team's purpose"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam}>Create Team</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => {
          const teamMembers = users.filter((user) => user.teamId === team.id)

          return (
            <Card key={team.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {team.description || "No description provided"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{teamMembers.length} members</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Team Members */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Members
                    </h4>

                    <Dialog
                      open={isAddMemberDialogOpen && selectedTeam === team.id}
                      onOpenChange={(open) => {
                        setIsAddMemberDialogOpen(open)
                        if (open) setSelectedTeam(team.id)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Member to {team.name}</DialogTitle>
                          <DialogDescription>Select an unassigned user to add to this team</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Select User</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a user" />
                              </SelectTrigger>
                              <SelectContent>
                                {unassignedUsers.map((user) => (
                                  <SelectItem key={user.telegramId} value={user.telegramId.toString()}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage src={user.photoUrl || "/placeholder.svg"} />
                                        <AvatarFallback className="text-xs">{user.firstName.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      {user.firstName} {user.lastName}
                                      {user.username && <span className="text-muted-foreground">@{user.username}</span>}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {unassignedUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No unassigned users available
                            </p>
                          )}

                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddMember} disabled={!selectedUserId}>
                              Add Member
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {teamMembers.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">No members assigned yet</div>
                    ) : (
                      teamMembers.map((member) => (
                        <div
                          key={member.telegramId}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.photoUrl || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{member.firstName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">
                                {member.firstName} {member.lastName}
                              </div>
                              {member.username && (
                                <div className="text-xs text-muted-foreground">@{member.username}</div>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.telegramId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Team Stats */}
                <div className="pt-3 border-t">
                  <div className="text-xs text-muted-foreground">Created {team.createdAt.toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No teams created yet</h3>
            <p className="text-muted-foreground mb-4">Create your first team to start organizing your employees</p>
          </CardContent>
        </Card>
      )}

      {/* Unassigned Users */}
      {unassignedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Unassigned Users
            </CardTitle>
            <CardDescription>Users who haven't been assigned to any team yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {unassignedUsers.map((user) => (
                <div key={user.telegramId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.photoUrl || "/placeholder.svg"} />
                    <AvatarFallback>{user.firstName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    {user.username && <div className="text-xs text-muted-foreground truncate">@{user.username}</div>}
                    <div className="text-xs text-muted-foreground">ID: {user.telegramId}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
