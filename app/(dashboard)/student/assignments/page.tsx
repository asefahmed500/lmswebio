/**
 * Student assignments overview page
 * Shows pending, submitted, and graded assignments across enrolled courses
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  Clock,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Calendar,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"

interface CourseInfo {
  id: number
  title: string
}

interface AssignmentItem {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  courseId: number
  course: CourseInfo
}

interface SubmissionItem {
  id: number
  assignmentId: number
  textAnswer: string | null
  fileUrl: string | null
  grade: number | null
  feedback: string | null
  submittedAt: string
  gradedAt: string | null
  assignment: AssignmentItem
}

interface EnrolmentData {
  courseId: number
  course: CourseInfo
}

/**
 * Due date display helper
 */
function DueDateDisplay({ dueDate }: { dueDate: string | null }) {
  const [now] = React.useState(() => Date.now())
  if (!dueDate) return null
  const due = new Date(dueDate).getTime()
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  let color: string
  let label: string
  if (diffDays < 0) {
    color = "text-destructive"
    label = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`
  } else if (diffDays === 0) {
    color = "text-destructive"
    label = "Due today"
  } else if (diffDays === 1) {
    color = "text-warning"
    label = "Due tomorrow"
  } else {
    color = "text-muted-foreground"
    label = `Due in ${diffDays} days`
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${color}`}>
      <Calendar className="size-4" />
      <span>{label}</span>
    </div>
  )
}

/**
 * Assignment card component
 */
function AssignmentCard({
  assignment,
  submission,
}: {
  assignment: AssignmentItem
  submission?: SubmissionItem | null
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-1 text-base">
              {assignment.title}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {assignment.description}
            </CardDescription>
          </div>
          {submission ? (
            submission.grade !== null ? (
              <Badge variant="default" className="shrink-0">
                {submission.grade}/{assignment.maxPoints}
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Submitted
              </Badge>
            )
          ) : (
            <Badge variant="outline" className="shrink-0">
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="size-4" />
              <span>{assignment.course.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="size-4" />
              <span>{assignment.maxPoints} pts</span>
            </div>
            <DueDateDisplay dueDate={assignment.dueDate} />
          </div>

          {submission ? (
            submission.grade !== null ? (
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/student/assignments/graded">View Feedback</Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Submitted{" "}
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              </div>
            )
          ) : (
            <Button className="w-full" asChild>
              <Link href="/student/assignments/pending">Submit Assignment</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Assignments overview page
 */
export default function StudentAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = React.useState<AssignmentItem[]>([])
  const [submissions, setSubmissions] = React.useState<SubmissionItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("pending")

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const enrolRes = await apiGet<EnrolmentData[]>("/enrolments/my")
        if (enrolRes.error || !enrolRes.data)
          throw new Error("Failed to fetch enrollments")
        const enrolments: EnrolmentData[] = enrolRes.data

        const courseIds = enrolments.map((e) => e.courseId)

        const assignResults = await Promise.all(
          courseIds.map((cid: number) =>
            apiGet<AssignmentItem[]>(`/assignments?courseId=${cid}`).then(
              (r) => r.data ?? []
            )
          )
        )

        const allAssignments: AssignmentItem[] = assignResults.flat()

        const subRes = await apiGet<SubmissionItem[]>(
          "/assignments/my-submissions"
        )
        const allSubmissions: SubmissionItem[] = subRes.data ?? []

        setAssignments(allAssignments)
        setSubmissions(allSubmissions)
      } catch (err) {
        console.error("Failed to load assignments:", err)
        setError("Failed to load assignments")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  const submittedIds = React.useMemo(
    () => new Set(submissions.map((s) => s.assignmentId)),
    [submissions]
  )

  const submissionMap = React.useMemo(
    () => new Map(submissions.map((s) => [s.assignmentId, s])),
    [submissions]
  )

  const pendingAssignments = React.useMemo(
    () => assignments.filter((a) => !submittedIds.has(a.id)),
    [assignments, submittedIds]
  )

  const submittedAssignments = React.useMemo(
    () =>
      assignments.filter((a) => {
        const sub = submissionMap.get(a.id)
        return sub && sub.grade === null
      }),
    [assignments, submissionMap]
  )

  const gradedAssignments = React.useMemo(
    () =>
      assignments.filter((a) => {
        const sub = submissionMap.get(a.id)
        return sub && sub.grade !== null
      }),
    [assignments, submissionMap]
  )

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading assignments...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">
            Error loading assignments
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
        <p className="mt-1 text-muted-foreground">
          View and submit assignments for your enrolled courses
        </p>
      </div>

      {assignments.length > 0 ? (
        <Tabs
          defaultValue="pending"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Submitted ({submittedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="graded">
              Graded ({gradedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingAssignments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingAssignments.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="py-12 text-center">
                    <CheckCircle2 className="text-success mx-auto mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No pending assignments
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve submitted all assignments. Great work!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="submitted" className="mt-6">
            {submittedAssignments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {submittedAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    submission={submissionMap.get(a.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="py-12 text-center">
                    <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No submitted assignments
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Assignments awaiting grading will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="graded" className="mt-6">
            {gradedAssignments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gradedAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    submission={submissionMap.get(a.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="py-12 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No graded assignments
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Grades will appear here once assignments are marked
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No assignments found
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Assignments from your enrolled courses will appear here
              </p>
              <Button asChild>
                <Link href="/student/courses/catalogue">Browse Courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
