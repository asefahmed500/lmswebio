/**
 * Assignment detail page with submissions for grading
 * Displays assignment info and all submissions with inline grading
 */

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2,
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
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
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
      const res = await fetch(
        `/api/assignments/submissions/${submission.id}/grade`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grade, feedback }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to submit grade")
      }
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
    <div className="space-y-3">
      {localError && (
        <p className="text-sm text-destructive">{localError}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`grade-${submission.id}`}>Grade</Label>
          <Input
            id={`grade-${submission.id}`}
            type="number"
            min={0}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`feedback-${submission.id}`}>Feedback</Label>
          <Textarea
            id={`feedback-${submission.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide feedback to the student..."
            disabled={isSubmitting}
            className="min-h-[60px]"
          />
        </div>
      </div>
      <Button
        size="sm"
        onClick={handleSubmitGrade}
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        )}
        Submit Grade
      </Button>
    </div>
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
      <Award className="mt-0.5 h-5 w-5 text-green-600" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-green-600">
            Grade: {submission.grade}/{submission.assignment?.maxPoints || "?"}
          </span>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Graded
          </Badge>
        </div>
        {submission.feedback && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Feedback:</p>
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

  const loadAssignment = React.useCallback(async () => {
    if (!user || !params.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assignments/${params.id}`)
      if (!res.ok) throw new Error("Failed to fetch assignment")
      const data = await res.json()
      setAssignment(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load assignment"
      )
    } finally {
      setIsLoading(false)
    }
  }, [user, params.id])

  React.useEffect(() => {
    loadAssignment()
  }, [loadAssignment])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">Error loading assignment</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {error || "Assignment not found"}
          </p>
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/instructor/assignments">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {assignment.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {assignment.course?.title || `Course #${assignment.courseId}`} &middot;{" "}
            {assignment.maxPoints} points max
          </p>
        </div>
      </div>

      {assignment.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {assignment.description}
            </p>
            {assignment.dueDate && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
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
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">
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
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {assignment.submissions.length === 0
              ? "No submissions yet"
              : `Review and grade student submissions (${pendingCount} pending)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {assignment.submissions.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No submissions</h3>
              <p className="text-sm text-muted-foreground">
                Students haven&apos;t submitted any work yet
              </p>
            </div>
          ) : (
            assignment.submissions.map((submission, index) => (
              <React.Fragment key={submission.id}>
                {index > 0 && <Separator />}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
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
                      <div>
                        <p className="text-sm font-medium">
                          {submission.user?.fullName || "Unknown Student"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted{" "}
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {submission.grade !== null &&
                    submission.grade !== undefined ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {submission.grade}/{assignment.maxPoints}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-amber-600">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  {submission.textAnswer && (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Answer:
                      </p>
                      <p className="whitespace-pre-wrap text-sm">
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
                        <Download className="mr-2 h-4 w-4" />
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
                      onGraded={loadAssignment}
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
