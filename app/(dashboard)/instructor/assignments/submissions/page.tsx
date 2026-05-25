/**
 * Combined submissions view across all assignments
 * Shows all student submissions with grading status and filtering
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import type { Assignment, AssignmentSubmission, Course } from "@/types"

interface SubmissionWithMeta extends AssignmentSubmission {
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
        const [assignmentsRes, coursesRes] = await Promise.all([
          fetch("/api/assignments"),
          fetch("/api/courses"),
        ])
        if (!assignmentsRes.ok) throw new Error("Failed to fetch assignments")
        if (!coursesRes.ok) throw new Error("Failed to fetch courses")

        const assignments: Assignment[] = await assignmentsRes.json()
        const courses: Course[] = await coursesRes.json()

        const courseMap = new Map(courses.map((c) => [c.id, c.title]))
        const assignmentMap = new Map(assignments.map((a) => [a.id, a]))

        const allSubmissions: SubmissionWithMeta[] = []
        for (const assignment of assignments) {
          try {
            const subRes = await fetch(
              `/api/assignments/${assignment.id}`
            )
            if (subRes.ok) {
              const data = await subRes.json()
              const subs = (data.submissions || data || []).map(
                (s: AssignmentSubmission) => ({
                  ...s,
                  assignmentTitle: assignment.title,
                  courseTitle: courseMap.get(assignment.courseId) || undefined,
                  courseId: assignment.courseId,
                })
              )
              allSubmissions.push(...subs)
            }
          } catch {
            // skip assignments that fail to load
          }
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
          (s.user?.fullName || "")
            .toLowerCase()
            .includes(q) ||
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading submissions...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          All Submissions
        </h1>
        <p className="mt-1 text-muted-foreground">
          View and manage all student submissions across your courses
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{submissions.length}</div>
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
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">{gradedCount}</div>
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
              <Clock className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">{pendingCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search submissions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={gradeFilter}
              onValueChange={(value) =>
                setGradeFilter(value as GradeFilter)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Submissions</SelectItem>
                <SelectItem value="GRADED">Graded</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
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
                            {(
submission.user?.fullName || "S"
                            )
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
                        {submission.assignmentTitle || `Assignment #${submission.assignmentId}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {submission.courseTitle || `Course #${submission.courseId}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {submission.grade !== null &&
                      submission.grade !== undefined ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {submission.grade} pts
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-amber-600">
                          <Clock className="h-3 w-3" />
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
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No submissions found
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || gradeFilter !== "ALL"
                  ? "Try adjusting your filters or search query"
                  : "No submissions have been made yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
