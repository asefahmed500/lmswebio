/**
 * Student pending assignments page
 * Shows unsubmitted assignments with inline submission form
 */

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  BookOpen,
  Calendar,
  Clock,
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

/**
 * Inline submission form
 */
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
      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textAnswer: textAnswer.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit assignment")
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
      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4" />
        Assignment submitted successfully!
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
            <Send className="mr-2 h-4 w-4" />
            Submit Assignment
          </>
        )}
      </Button>
    </div>
  )
}

/**
 * Due date display
 */
function DueDateBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null

  const now = Date.now()
  const due = new Date(dueDate).getTime()
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  let variant: "default" | "secondary" | "destructive" | "outline" =
    "outline"
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

/**
 * Pending assignments page
 */
export default function PendingAssignmentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [assignments, setAssignments] = React.useState<AssignmentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [openFormId, setOpenFormId] = React.useState<number | null>(null)

  const loadData = React.useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const enrolRes = await fetch("/api/enrolments/my")
      if (!enrolRes.ok) throw new Error("Failed to fetch enrollments")
      const enrolments: { courseId: number }[] = await enrolRes.json()

      const courseIds = enrolments.map((e) => e.courseId)

      const assignResults = await Promise.all(
        courseIds.map((cid: number) =>
          fetch(`/api/assignments?courseId=${cid}`).then((r) =>
            r.ok ? r.json() : []
          )
        )
      )

      const allAssignments: AssignmentItem[] = assignResults.flat()

      const subRes = await fetch("/api/assignments/my-submissions")
      const submissions: SubmissionItem[] = subRes.ok
        ? await subRes.json()
        : []

      const submittedIds = new Set(submissions.map((s) => s.assignmentId))
      const pending = allAssignments.filter((a) => !submittedIds.has(a.id))

      setAssignments(pending)
    } catch (err) {
      console.error("Failed to load assignments:", err)
      setError("Failed to load assignments")
    } finally {
      setIsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmitted = () => {
    setOpenFormId(null)
    loadData()
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Pending Assignments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Assignments that still need your submission
        </p>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-4">
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
              <CardContent className="space-y-3">
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
                        Due{" "}
                        {new Date(assignment.dueDate).toLocaleDateString()}
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
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-semibold">
                No pending assignments
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                You&apos;ve submitted all assignments. Great work!
              </p>
              <Button asChild>
                <a href="/student/assignments">View All Assignments</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
