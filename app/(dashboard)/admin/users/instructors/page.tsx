"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Loader2,
  UserPlus,
  Mail,
  BookOpen,
  Users,
  Star,
} from "lucide-react"
import { apiGet } from "@/lib/api-client"

interface ApiUser {
  id: number
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  _count?: { courses: number; enrolments: number }
}

export default function InstructorsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [instructors, setInstructors] = React.useState<ApiUser[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiGet<{ users: ApiUser[] }>(
          "/admin/users?role=INSTRUCTOR"
        )
        if (res.data) {
          setInstructors(res.data.users || [])
        } else {
          throw new Error(res.error || "Failed to load instructors")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = instructors.filter(
    (i) =>
      i.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold">Instructors</h1>
          <p className="text-muted-foreground">Manage instructor accounts</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="mr-2 size-4" />
            Add Instructor
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search instructors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Instructors ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No instructors found
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((instructor) => (
                <div
                  key={instructor.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {instructor.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{instructor.fullName}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="size-3" />
                        {instructor.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {instructor._count?.courses ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Courses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {instructor._count?.enrolments ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <Badge
                      variant={instructor.isActive ? "default" : "secondary"}
                    >
                      {instructor.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/users/${instructor.id}`}>
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
