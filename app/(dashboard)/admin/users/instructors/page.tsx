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

  if (isLoading) return <PageLoading label="Loading instructors…" />

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
        title="Instructors"
        description="Manage instructor accounts"
        action={
          <Button asChild>
            <Link href="/admin/users/new">
              <UserPlus data-icon="inline-start" />
              Add Instructor
            </Link>
          </Button>
        }
      />

      <InputGroup className="h-9 max-w-sm">
        <InputGroupInput
          placeholder="Search instructors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon align="inline-start">
          <Search />
        </InputGroupAddon>
      </InputGroup>

      <Card>
        <CardHeader>
          <CardTitle>All Instructors ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No instructors found</EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "No instructors match your search. Try a different query."
                    : "No instructors have been created yet. Add your first instructor to get started."}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <Button asChild>
                    <Link href="/admin/users/new">
                      <UserPlus data-icon="inline-start" />
                      Add Instructor
                    </Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((instructor) => (
                <div
                  key={instructor.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar className="shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {instructor.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {instructor.fullName}
                      </p>
                      <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <Mail className="size-3 shrink-0" />
                        {instructor.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">
                        {instructor._count?.courses ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Courses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">
                        {instructor._count?.enrolments ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <Badge
                      variant={instructor.isActive ? "default" : "secondary"}
                    >
                      {instructor.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      aria-label="Edit instructor"
                    >
                      <Link href={`/admin/users/${instructor.id}`}>
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
