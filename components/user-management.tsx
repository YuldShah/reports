"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Filter, User as UserIcon, Building, Calendar, Edit3, Shield } from "lucide-react"
import { type User, type Team } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface UserManagementProps {
  onDataChange?: () => void
}

export default function UserManagement({ onDataChange }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name") // name, registration
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      const usersWithDates = (usersData.users || []).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }))
      setUsers(usersWithDates)

      // Fetch teams
      const teamsResponse = await fetch('/api/teams')
      const teamsData = await teamsResponse.json()
      const teamsWithDates = (teamsData.teams || []).map((team: any) => ({
        ...team,
        createdAt: new Date(team.createdAt)
      }))
      setTeams(teamsWithDates)
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

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewRole(user.role)
    setIsEditDialogOpen(true)
  }

  const handleSaveRole = async () => {
    if (!editingUser || !newRole.trim()) {
      toast({
        title: "Error",
        description: "Role is required",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: editingUser.telegramId,
          role: newRole.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      toast({
        title: "Success",
        description: `User role updated successfully`,
        duration: 3000,
      })

      setIsEditDialogOpen(false)
      setEditingUser(null)
      setNewRole("")
      await fetchData()
      onDataChange?.()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName || ''}`.toLowerCase()
      const username = user.username?.toLowerCase() || ''
      
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        username.includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === "all" || 
        (roleFilter === "admin" && user.role === "admin") ||
        (roleFilter === "employee" && user.role === "employee") ||
        (roleFilter === "custom" && user.role !== "admin" && user.role !== "employee")
      
      const matchesTeam = teamFilter === "all" || 
        (teamFilter === "unassigned" && !user.teamId) ||
        user.teamId === teamFilter

      return matchesSearch && matchesRole && matchesTeam
    })

    // Sort users
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.firstName} ${a.lastName || ''}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName || ''}`.toLowerCase()
        return nameA.localeCompare(nameB)
      } else if (sortBy === "registration") {
        return b.createdAt.getTime() - a.createdAt.getTime() // Most recent first
      }
      return 0
    })

    return filtered
  }, [users, searchTerm, roleFilter, teamFilter, sortBy])

  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "destructive"
    if (role === "employee") return "default"
    return "secondary" // For custom roles
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold">User Management</h2>
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
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Sort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="custom">Custom Roles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="registration">Registration Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedUsers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {users.length === 0
                  ? "No users have been registered yet."
                  : "Try adjusting your filters to see more results."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedUsers.map((user) => {
            const team = teams.find((t) => t.id === user.teamId)

            return (
              <Card key={user.telegramId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.photoUrl} alt={user.firstName} />
                      <AvatarFallback>
                        {user.firstName.charAt(0)}
                        {user.lastName?.charAt(0) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight">
                        {user.firstName} {user.lastName}
                      </CardTitle>
                      {user.username && (
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex-shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                    </div>

                    {team && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{team.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Joined {user.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Summary */}
      {filteredAndSortedUsers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Showing {filteredAndSortedUsers.length} of {users.length} users
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingUser?.firstName} {editingUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar>
                <AvatarImage src={editingUser?.photoUrl} alt={editingUser?.firstName} />
                <AvatarFallback>
                  {editingUser?.firstName.charAt(0)}
                  {editingUser?.lastName?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {editingUser?.firstName} {editingUser?.lastName}
                </p>
                {editingUser?.username && (
                  <p className="text-sm text-muted-foreground">@{editingUser.username}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Enter role (e.g., admin, employee, manager, etc.)"
              />
              <p className="text-sm text-muted-foreground">
                You can enter any custom role name
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingUser(null)
                  setNewRole("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>
                Save Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}