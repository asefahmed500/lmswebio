"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  Calendar,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
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
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api-client"

interface AssignmentItem {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  courseId: number
  course: { id: number; title: string }
}

interface SubmissionItem {
  id: number
  assignmentId: number
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
      <div className="bg-success/10 text-success flex items-center gap-2 rounded-lg p-3 text-sm">
        <CheckCircle2 className="h-4 w-4" />
        Assignment submitted successfully!
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        placeholder="Type your answer here..."
        value={textAnswer}
        onChange={(e) => setTextAnswer(e.target.value)}
        className="min-h-[120px]"
        disabled={isSubmitting}
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !textAnswer.trim()}
      >
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Submitting...
          </>
        ) : (
          <>
            <Send data-icon="inline-start" />
            Submit Assignment
          </>
        )}
      </Button>
    </div>
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
  const [openFormId, setOpenFormId] = React.useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  React.useEffect(() => {
    if (!user) return

    let cancelled = false

    async function load() {
      try {
        const enrolResult =
          await apiGet<{ courseId: number }[]>("/enrolments/my")
        if (enrolResult.error) throw new Error("Failed to fetch enrollments")
        const enrolments = enrolResult.data!

        const courseIds = enrolments.map((e) => e.courseId)

        const assignResults = await Promise.all(
          courseIds.map((cid: number) =>
            apiGet(`/assignments?courseId=${cid}`).then((r) =>
              r.data ? r.data : []
            )
          )
        )

        const allAssignments: AssignmentItem[] =
          assignResults.flat() as AssignmentItem[]

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
        <h1 className="text-3xl font-bold tracking-tight">
          Pending Assignments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Assignments that still need your submission
        </p>
      </div>

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
                    <FileText className="h-4 w-4" />
                    <span>{assignment.maxPoints} points</span>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
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
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <CheckCircle2 className="text-success mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                No pending assignments
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                You&apos;ve submitted all assignments. Great work!
              </p>
              <Button asChild>
                <Link href="/student/assignments">View All Assignments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
