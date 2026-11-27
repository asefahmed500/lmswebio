"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  Calendar,
  Send,
  CircleAlert,
  CheckCircle2,
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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { LoadingCard } from "@/components/loading-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api-client"

interface AssignmentItem {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  courseId: string
  course: { id: string; title: string }
}

interface SubmissionItem {
  id: string
  assignmentId: string
}

function SubmissionForm({
  assignment,
  onSubmitted,
}: {
  assignment: AssignmentItem
  onSubmitted: () => void
}) {
  const [textAnswer, setTextAnswer] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async () => {
    if (!textAnswer.trim()) {
      setError("Please provide an answer before submitting")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await apiPost(`/assignments/${assignment.id}/submit`, {
        textAnswer: textAnswer.trim(),
      })

      if (res.error) {
        throw new Error(res.error || "Failed to submit assignment")
      }

      setSuccess(true)
      setTimeout(onSubmitted, 1500)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit assignment"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-success/30 text-success">
        <CheckCircle2 />
        <AlertDescription>Assignment submitted successfully!</AlertDescription>
      </Alert>
    )
  }

  return (
    <FieldGroup>
      <Field data-invalid={!!error || undefined}>
        <FieldLabel htmlFor={`answer-${assignment.id}`}>Your answer</FieldLabel>
        <Textarea
          id={`answer-${assignment.id}`}
          placeholder="Type your answer here..."
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          className="min-h-32"
          disabled={isSubmitting}
          aria-invalid={!!error}
        />
        <FieldError>{error}</FieldError>
      </Field>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !textAnswer.trim()}
      >
        {isSubmitting ? <Spinner /> : <Send data-icon="inline-start" />}
        {isSubmitting ? "Submitting..." : "Submit Assignment"}
      </Button>
    </FieldGroup>
  )
}

function DueDateBadge({ dueDate }: { dueDate: string | null }) {
  const [now] = React.useState(() => Date.now())
  if (!dueDate) return null
  const due = new Date(dueDate).getTime()
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
  let label: string
  if (diffDays < 0) {
    variant = "destructive"
    label = `Overdue by ${Math.abs(diffDays)}d`
  } else if (diffDays === 0) {
    variant = "destructive"
    label = "Due today"
  } else if (diffDays <= 3) {
    variant = "secondary"
    label = `${diffDays}d left`
  } else {
    label = new Date(dueDate).toLocaleDateString()
  }

  return <Badge variant={variant}>{label}</Badge>
}

export default function PendingAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = React.useState<AssignmentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [openFormId, setOpenFormId] = React.useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  React.useEffect(() => {
    if (!user) return

    let cancelled = false

    async function load() {
      try {
        const enrolResult =
          await apiGet<{ courseId: string }[]>("/enrolments/my")
        if (enrolResult.error) throw new Error("Failed to fetch enrollments")
        const enrolments = enrolResult.data!

        const courseIds = enrolments.map((e) => e.courseId)

        // Fixed: API returns { assignments: [...] }, not array directly
        const assignResults = await Promise.all(
          courseIds.map((cid: string) =>
            apiGet<{ assignments: AssignmentItem[] }>(
              `/assignments?courseId=${cid}`
            ).then((r) => r.data?.assignments ?? [])
          )
        )

        const allAssignments: AssignmentItem[] = assignResults.flat()

        const subResult = await apiGet<SubmissionItem[]>(
          "/assignments/my-submissions"
        )
        const submissions = subResult.data ?? []

        const submittedIds = new Set(submissions.map((s) => s.assignmentId))
        const pending = allAssignments.filter((a) => !submittedIds.has(a.id))

        if (!cancelled) setAssignments(pending)
      } catch (err) {
        console.error("Failed to load assignments:", err)
        if (!cancelled) setError("Failed to load assignments")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user, refreshTrigger])

  const handleSubmitted = () => {
    setOpenFormId(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <LoadingCard count={3} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle>Error loading assignments</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Pending Assignments"
        description="Assignments that still need your submission"
      />

      {assignments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {assignment.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {assignment.course.title}
                    </CardDescription>
                  </div>
                  <DueDateBadge dueDate={assignment.dueDate} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {assignment.description && (
                  <p className="text-sm text-muted-foreground">
                    {assignment.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="size-4" />
                    <span>{assignment.maxPoints} points</span>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      <span>
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {openFormId === assignment.id ? (
                  <SubmissionForm
                    assignment={assignment}
                    onSubmitted={handleSubmitted}
                  />
                ) : (
                  <Button
                    onClick={() => setOpenFormId(assignment.id)}
                    className="w-full"
                  >
                    Submit Assignment
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle>No pending assignments</EmptyTitle>
            <EmptyDescription>
              You&apos;ve submitted all assignments. Great work!
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/student/assignments">View All Assignments</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
