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
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import type { AssignmentSubmission, Assignment } from "@/types"

interface SubmissionWithMeta extends AssignmentSubmission {
  assignmentTitle?: string
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
        const assignmentsResult = await apiGet<{ assignments: Assignment[] }>(
          "/assignments"
        )
        if (assignmentsResult.error) throw new Error(assignmentsResult.error)
        const assignments = assignmentsResult.data!.assignments

        const ungraded: SubmissionWithMeta[] = []
        for (const assignment of assignments) {
          try {
            const subResult = await apiGet<{
              assignment: { submissions: AssignmentSubmission[] }
            }>(`/assignments/${assignment.id}`)
            if (!subResult.error) {
              const data = subResult.data
              const subs = (data?.assignment?.submissions ?? [])
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

  const header = (
    <PageHeader
      title="To Grade"
      description="Review and grade student submissions that need your attention"
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
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-warning" />
              <div className="text-2xl font-semibold">{submissions.length}</div>
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
              <GraduationCap className="size-5 text-info" />
              <div className="text-2xl font-semibold">
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
              <div className="text-2xl font-semibold">
                {new Set(submissions.map((s) => s.assignmentId)).size}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <InputGroup className="h-9 max-w-sm min-w-0 flex-1">
            <InputGroupInput
              type="search"
              placeholder="Search by student or assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
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
                      <Badge variant="outline" className="gap-1 text-warning">
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
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>Nothing to grade</EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "All submissions have been graded. Great work!"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
