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
import { Plus, Users, UserPlus, Trash2, Building, FileText, Settings } from "lucide-react"
import { type User, type Team, type ReportTemplate } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface TeamManagementProps {
  onDataChange?: () => void
}

export default function TeamManagement({ onDataChange }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [newTeam, setNewTeam] = useState({ name: "", description: "" })
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch teams, users, and templates in parallel
      const [teamsResponse, usersResponse, templatesResponse] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/users'),
        fetch('/api/templates')
      ])

      const teamsData = await teamsResponse.json()
      const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
        ...team,
        createdAt: new Date(team.createdAt)
      }))
      setTeams(teamsWithDates)

      const usersData = await usersResponse.json()
      const usersWithDates = (usersData.users || []).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }))
      setUsers(usersWithDates)

      const templatesData = await templatesResponse.json()
      setTemplates(templatesData.templates || [])
    } catch (error) {
      alert(`Error fetching data: ${error instanceof Error ? error.message : String(error)}`)
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
    }
  }

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

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete the team "${teamName}"? All members will be unassigned.`)) {
      return
    }

    try {
      const response = await fetch(`/api/teams?id=${teamId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete team')
      }

      // Refresh local data
      await fetchData()

      toast({
        title: "Success",
        description: "Team deleted successfully",
        duration: 3000,
      })

      // Notify parent to refresh data
      onDataChange?.()
    } catch (error) {
      console.error('Error deleting team:', error)
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleAssignTemplate = async () => {
    if (!selectedTeam) return

    try {
      const response = await fetch('/api/teams', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: selectedTeam,
          templateId: selectedTemplateId || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign template')
      }

      // Refresh local data
      await fetchData()
      setSelectedTemplateId("")
      setIsTemplateDialogOpen(false)

      toast({
        title: "Success",
        description: selectedTemplateId ? "Template assigned successfully" : "Template removed successfully",
        duration: 3000,
      })

      // Notify parent to refresh data
      onDataChange?.()
    } catch (error) {
      console.error('Error assigning template:', error)
      toast({
        title: "Error",
        description: "Failed to assign template",
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

        {/* Create Team Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
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
                  placeholder="Enter team name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="team-description">Description (Optional)</Label>
                <Textarea
                  id="team-description"
                  placeholder="Enter team description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateTeam} className="flex-1">
                  Create Team
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewTeam({ name: "", description: "" })
                    setIsCreateDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
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
                      {team.templateId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Template: {templates.find(t => t.id === team.templateId)?.name || "Unknown"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{teamMembers.length} members</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTeam(team.id)
                        setSelectedTemplateId(team.templateId || "")
                        setIsTemplateDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0"
                      disabled={loading}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Team Members */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Team Members</h4>
                    <Dialog
                      open={isAddMemberDialogOpen && selectedTeam === team.id}
                      onOpenChange={(open) => {
                        setIsAddMemberDialogOpen(open)
                        if (open) {
                          setSelectedTeam(team.id)
                        } else {
                          setSelectedTeam(null)
                          setSelectedUserId("")
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <UserPlus className="w-3 h-3 mr-1" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Member to {team.name}</DialogTitle>
                          <DialogDescription>Select a user to add to this team</DialogDescription>
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
                                    {user.firstName} {user.lastName} 
                                    {user.username && ` (@${user.username})`}
                                    {` [ID: ${user.telegramId}]`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleAddMember} disabled={!selectedUserId}>
                              Add Member
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member: User) => (
                        <div key={member.telegramId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.photoUrl || "/placeholder.svg"} />
                              <AvatarFallback>{member.firstName.charAt(0)}</AvatarFallback>
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
                            variant="outline"
                            onClick={() => handleRemoveMember(member.telegramId)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No members assigned yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Stats */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Created {team.createdAt.toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Template Assignment Dialog */}
      {isTemplateDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Assign Report Template</CardTitle>
              <CardDescription>Choose a template for this team's reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Template</Label>
                <select 
                  value={selectedTemplateId || ""} 
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No template (use default form)</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAssignTemplate} className="flex-1">
                  {selectedTemplateId ? "Assign Template" : "Remove Template"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsTemplateDialogOpen(false)
                    setSelectedTemplateId("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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