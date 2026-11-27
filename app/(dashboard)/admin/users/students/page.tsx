"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, UserPlus, Mail, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageLoading } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { apiGet } from "@/lib/api-client"

interface ApiUser {
  id: string
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

  if (isLoading) return <PageLoading label="Loading students…" />

  if (error) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Manage student accounts"
        action={
          <Button asChild>
            <Link href="/admin/users/new">
              <UserPlus data-icon="inline-start" />
              Add Student
            </Link>
          </Button>
        }
      />

      <InputGroup className="h-9 max-w-sm">
        <InputGroupInput
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon align="inline-start">
          <Search />
        </InputGroupAddon>
      </InputGroup>

      <Card>
        <CardHeader>
          <CardTitle>All Students ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No students found</EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "No students match your search. Try a different query."
                    : "No students have registered yet. Students can sign up on their own, or you can add them manually."}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <Button asChild>
                    <Link href="/admin/users/new">
                      <UserPlus data-icon="inline-start" />
                      Add Student
                    </Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar className="shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {student.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{student.fullName}</p>
                      <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <Mail className="size-3 shrink-0" />
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      aria-label="Edit student"
                    >
                      <Link href={`/admin/users/${student.id}`}>
                        <Users />
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
