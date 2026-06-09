"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Clock, Search, GraduationCap } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import type { AssignmentSubmission, Assignment } from "@/types"

interface SubmissionWithMeta extends AssignmentSubmission {
  assignmentTitle?: string
}

interface AssignmentDetailResponse {
  submissions?: AssignmentSubmission[]
}

export default function GradingPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = React.useState<SubmissionWithMeta[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    async function loadData() {
      if (!user) return
      setIsLoading(true)
      try {
        const assignmentsResult = await apiGet<Assignment[]>("/assignments")
        if (assignmentsResult.error) throw new Error(assignmentsResult.error)
        const assignments = assignmentsResult.data!

        const ungraded: SubmissionWithMeta[] = []
        for (const assignment of assignments) {
          try {
            const subResult = await apiGet<AssignmentDetailResponse>(
              `/assignments/${assignment.id}`
            )
            if (!subResult.error) {
              const data = subResult.data
              const subs = (
                data?.submissions ?? (Array.isArray(data) ? data : [])
              )
                .filter(
                  (s: AssignmentSubmission) =>
                    s.grade === null || s.grade === undefined
                )
                .map((s: AssignmentSubmission) => ({
                  ...s,
                  assignmentTitle: assignment.title,
                }))
              ungraded.push(...subs)
            }
          } catch {}
        }
        setSubmissions(ungraded)
      } catch (error) {
        console.error("Failed to load submissions:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user])

  const filteredSubmissions = React.useMemo(() => {
    if (!searchQuery) return submissions
    const q = searchQuery.toLowerCase()
    return submissions.filter(
      (s) =>
        (s.user?.fullName || "").toLowerCase().includes(q) ||
        (s.assignmentTitle || "").toLowerCase().includes(q)
    )
  }, [submissions, searchQuery])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading submissions to grade...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">To Grade</h1>
        <p className="mt-1 text-muted-foreground">
          Review and grade student submissions that need your attention
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="text-warning size-5" />
              <div className="text-2xl font-bold">{submissions.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="text-info size-5" />
              <div className="text-2xl font-bold">
                {new Set(submissions.map((s) => s.userId)).size}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <div className="text-2xl font-bold">
                {new Set(submissions.map((s) => s.assignmentId)).size}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by student or assignment..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
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
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-warning gap-1">
                        <Clock className="size-3" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/instructor/assignments/${submission.assignmentId}`}
                        >
                          Grade
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Nothing to grade</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "All submissions have been graded. Great work!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
