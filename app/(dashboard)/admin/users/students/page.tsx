"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Loader2,
  UserPlus,
  Mail,
  Users,
} from "lucide-react"
import { apiGet } from "@/lib/api-client"

interface ApiUser {
  id: number
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  avatarUrl?: string
  _count?: { enrolments: number }
}

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [students, setStudents] = React.useState<ApiUser[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiGet<{ users: ApiUser[] }>(
          "/admin/users?role=STUDENT"
        )
        if (res.data) {
          setStudents(res.data.users || [])
        } else {
          throw new Error(res.error || "Failed to load students")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student accounts</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="mr-2 size-4" />
            Add Student
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No students found
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {student.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="size-3" />
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {student._count?.enrolments ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Enrolled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Joined:{" "}
                        {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/users/${student.id}`}>
                        <Users className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
