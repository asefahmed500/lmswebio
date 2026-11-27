/**
 * Assignment detail page with submissions for grading
 * Displays assignment info and all submissions with inline grading
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle,
  CircleAlert,
  Download,
  Award,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { LoadingCard } from "@/components/loading-skeleton"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPut } from "@/lib/api-client"
import type { Assignment, AssignmentSubmission } from "@/types"

interface AssignmentDetail extends Assignment {
  submissions: AssignmentSubmission[]
}

/**
 * Inline grading form for a single submission
 */
function SubmissionGradeForm({
  submission,
  onGraded,
}: {
  submission: AssignmentSubmission
  onGraded: () => void
}) {
  const [grade, setGrade] = React.useState<number>(submission.grade ?? 0)
  const [feedback, setFeedback] = React.useState(submission.feedback ?? "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)

  const handleSubmitGrade = async () => {
    if (grade < 0) {
      setLocalError("Grade cannot be negative")
      return
    }
    setIsSubmitting(true)
    setLocalError(null)
    try {
      const res = await apiPut(
        `/assignments/submissions/${submission.id}/grade`,
        { grade, feedback } as Record<string, unknown>
      )
      if (res.error) throw new Error(res.error)
      onGraded()
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to submit grade"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FieldGroup className="gap-3">
      <FieldError>{localError}</FieldError>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor={`grade-${submission.id}`}>Grade</FieldLabel>
          <Input
            id={`grade-${submission.id}`}
            type="number"
            min={0}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            disabled={isSubmitting}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`feedback-${submission.id}`}>
            Feedback
          </FieldLabel>
          <Textarea
            id={`feedback-${submission.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide feedback to the student..."
            disabled={isSubmitting}
            className="min-h-[60px]"
          />
        </Field>
      </div>
      <Field>
        <Button
          size="sm"
          onClick={handleSubmitGrade}
          disabled={isSubmitting}
          className="w-fit"
        >
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Submit Grade
        </Button>
      </Field>
    </FieldGroup>
  )
}

/**
 * Display graded submission result
 */
function GradedSubmissionResult({
  submission,
}: {
  submission: AssignmentSubmission
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
      <Award className="mt-0.5 size-5 text-success" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-success">
            Grade: {submission.grade}/{submission.assignment?.maxPoints || "?"}
          </span>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="size-3" />
            Graded
          </Badge>
        </div>
        {submission.feedback && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Feedback:
            </p>
            <p className="text-sm">{submission.feedback}</p>
          </div>
        )}
        {submission.gradedAt && (
          <p className="text-xs text-muted-foreground">
            Graded on {new Date(submission.gradedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [assignment, setAssignment] = React.useState<AssignmentDetail | null>(
    null
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  React.useEffect(() => {
    if (!user || !params.id) return

    let cancelled = false

    apiGet<{ assignment: AssignmentDetail }>(`/assignments/${params.id}`)
      .then((res) => {
        if (!cancelled) {
          if (res.error) throw new Error(res.error)
          setAssignment(res.data!.assignment)
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load assignment"
          )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, params.id, refreshTrigger])

  const backButton = (
    <Button
      variant="ghost"
      size="icon"
      asChild
      aria-label="Back to assignments"
    >
      <Link href="/instructor/assignments">
        <ArrowLeft />
      </Link>
    </Button>
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          {backButton}
          <PageHeader
            className="min-w-0 flex-1"
            title="Assignment"
            description="Assignment overview and submissions"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingCard count={3} />
        </div>
        <LoadingCard />
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          {backButton}
          <PageHeader
            className="min-w-0 flex-1"
            title="Error loading assignment"
            description={error || "Assignment not found"}
          />
        </div>
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlert />
            </EmptyMedia>
            <EmptyTitle>Error loading assignment</EmptyTitle>
            <EmptyDescription>
              {error || "Assignment not found"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <div>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const gradedCount = assignment.submissions.filter(
    (s) => s.grade !== null && s.grade !== undefined
  ).length
  const pendingCount = assignment.submissions.length - gradedCount

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start gap-4">
        {backButton}
        <PageHeader
          className="min-w-0 flex-1"
          title={assignment.title}
          description={
            <>
              {assignment.course?.title || `Course #${assignment.courseId}`}{" "}
              &middot; {assignment.maxPoints} points max
            </>
          }
        />
      </div>

      {assignment.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {assignment.description}
            </p>
            {assignment.dueDate && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className="font-medium">
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
                {new Date(assignment.dueDate) < new Date() && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <div className="text-2xl font-semibold">
                {assignment.submissions.length}
              </div>
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
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {assignment.submissions.length === 0
              ? "No submissions yet"
              : `Review and grade student submissions (${pendingCount} pending)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {assignment.submissions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No submissions</EmptyTitle>
                <EmptyDescription>
                  Students haven&apos;t submitted any work yet
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            assignment.submissions.map((submission, index) => (
              <React.Fragment key={submission.id}>
                {index > 0 && <Separator />}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {(submission.user?.fullName || "S")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {submission.user?.fullName || "Unknown Student"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted{" "}
                          {new Date(
                            submission.submittedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {submission.grade !== null &&
                    submission.grade !== undefined ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="size-3" />
                        {submission.grade}/{assignment.maxPoints}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-warning">
                        <Clock className="size-3" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  {submission.textAnswer && (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Answer:
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {submission.textAnswer}
                      </p>
                    </div>
                  )}

                  {submission.fileUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download data-icon="inline-start" />
                        View Submitted File
                      </a>
                    </Button>
                  )}

                  {submission.grade !== null &&
                  submission.grade !== undefined ? (
                    <GradedSubmissionResult submission={submission} />
                  ) : (
                    <SubmissionGradeForm
                      submission={submission}
                      onGraded={() => setRefreshTrigger((prev) => prev + 1)}
                    />
                  )}
                </div>
              </React.Fragment>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
