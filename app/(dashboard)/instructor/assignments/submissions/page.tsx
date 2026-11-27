"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Clock, CheckCircle, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingCard } from "@/components/loading-skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"

interface SubmissionWithMeta {
  id: number
  user?: { id: number; fullName: string; avatarUrl?: string | null }
  grade?: number | null
  submittedAt?: string
  assignmentId?: number
  assignmentTitle?: string
  courseTitle?: string
  courseId?: number
}

type GradeFilter = "ALL" | "GRADED" | "PENDING"

export default function AllSubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = React.useState<SubmissionWithMeta[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [gradeFilter, setGradeFilter] = React.useState<GradeFilter>("ALL")

  React.useEffect(() => {
    async function loadData() {
      if (!user) return
      setIsLoading(true)
      try {
        const [assignmentsResult, coursesResult] = await Promise.all([
          apiGet<{
            assignments: { id: number; title: string; courseId: number }[]
          }>("/assignments"),
          apiGet<{ courses: { id: number; title: string }[] }>("/courses"),
        ])

        if (assignmentsResult.error || !assignmentsResult.data)
          throw new Error("Failed to fetch assignments")
        if (coursesResult.error || !coursesResult.data)
          throw new Error("Failed to fetch courses")

        const assignments = assignmentsResult.data.assignments || []
        const courses = coursesResult.data.courses || []

        const courseMap = new Map(courses.map((c) => [c.id, c.title]))

        const allSubmissions: SubmissionWithMeta[] = []
        for (const assignment of assignments) {
          try {
            const subResult = await apiGet<{
              assignment: { submissions: SubmissionWithMeta[] }
            }>(`/assignments/${assignment.id}`)
            if (subResult.data) {
              const subs = (subResult.data.assignment?.submissions || []).map(
                (s: SubmissionWithMeta) => ({
                  ...s,
                  ...s,
                  assignmentTitle: assignment.title,
                  courseTitle: courseMap.get(assignment.courseId) || undefined,
                  courseId: assignment.courseId,
                })
              )
              allSubmissions.push(...subs)
            }
          } catch {}
        }
        setSubmissions(allSubmissions)
      } catch (error) {
        console.error("Failed to load submissions:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user])

  const filteredSubmissions = React.useMemo(() => {
    let filtered = [...submissions]

    if (gradeFilter === "GRADED") {
      filtered = filtered.filter(
        (s) => s.grade !== null && s.grade !== undefined
      )
    } else if (gradeFilter === "PENDING") {
      filtered = filtered.filter(
        (s) => s.grade === null || s.grade === undefined
      )
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          (s.user?.fullName || "").toLowerCase().includes(q) ||
          (s.assignmentTitle || "").toLowerCase().includes(q) ||
          (s.courseTitle || "").toLowerCase().includes(q)
      )
    }

    return filtered
  }, [submissions, gradeFilter, searchQuery])

  const gradedCount = submissions.filter(
    (s) => s.grade !== null && s.grade !== undefined
  ).length
  const pendingCount = submissions.length - gradedCount

  const header = (
    <PageHeader
      title="All Submissions"
      description="View and manage all student submissions across your courses"
    />
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {header}
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingCard count={3} />
        </div>
        <LoadingCard />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {header}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <div className="text-2xl font-semibold">{submissions.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-success" />
              <div className="text-2xl font-semibold">{gradedCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-warning" />
              <div className="text-2xl font-semibold">{pendingCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <InputGroup className="h-9 max-w-sm min-w-0 flex-1">
              <InputGroupInput
                type="search"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <Select
              value={gradeFilter}
              onValueChange={(value) => setGradeFilter(value as GradeFilter)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All Submissions</SelectItem>
                  <SelectItem value="GRADED">Graded</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {(submission.user?.fullName || "S")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {submission.user?.fullName || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {submission.assignmentTitle ||
                          `Assignment #${submission.assignmentId}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {submission.courseTitle ||
                          `Course #${submission.courseId}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(
                          submission.submittedAt || ""
                        ).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {submission.grade !== null &&
                      submission.grade !== undefined ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="size-3" />
                          {submission.grade} pts
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-warning">
                          <Clock className="size-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/instructor/assignments/${submission.assignmentId}`}
                        >
                          {submission.grade !== null &&
                          submission.grade !== undefined
                            ? "View"
                            : "Grade"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No submissions found</EmptyTitle>
                <EmptyDescription>
                  {searchQuery || gradeFilter !== "ALL"
                    ? "Try adjusting your filters or search query"
                    : "No submissions have been made yet"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
