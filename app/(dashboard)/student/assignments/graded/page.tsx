/**
 * Student graded assignments page
 * Shows graded assignments with scores and feedback
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  BookOpen,
  Calendar,
  HelpCircle,
  Trophy,
  MessageSquareText,
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
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"

interface GradedSubmission {
  id: number
  assignmentId: number
  textAnswer: string | null
  fileUrl: string | null
  grade: number | null
  feedback: string | null
  submittedAt: string
  gradedAt: string | null
  assignment: {
    id: number
    title: string
    description: string | null
    dueDate: string | null
    maxPoints: number
    courseId: number
    course: { id: number; title: string }
  }
}

/**
 * Feedback dialog component
 */
function FeedbackDialog({
  submission,
}: {
  submission: GradedSubmission
}) {
  const percentage =
    submission.grade !== null && submission.assignment.maxPoints > 0
      ? (submission.grade / submission.assignment.maxPoints) * 100
      : 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquareText className="mr-2 h-4 w-4" />
          View Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{submission.assignment.title}</DialogTitle>
          <DialogDescription>
            {submission.assignment.course.title}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Score */}
            <div className="rounded-lg bg-muted p-4">
              <div className="mb-1 text-sm text-muted-foreground">Score</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {submission.grade?.toFixed(0) ?? "—"}
                </span>
                <span className="text-lg text-muted-foreground">
                  / {submission.assignment.maxPoints}
                </span>
                <Badge
                  variant={percentage >= 70 ? "default" : "secondary"}
                  className="ml-2"
                >
                  {percentage.toFixed(0)}%
                </Badge>
              </div>
            </div>

            {/* Your answer */}
            {submission.textAnswer && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Your Answer</h4>
                <div className="rounded-lg border bg-card p-3 text-sm">
                  {submission.textAnswer}
                </div>
              </div>
            )}

            {/* Feedback */}
            {submission.feedback && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Instructor Feedback</h4>
                <div className="rounded-lg border bg-card p-3 text-sm">
                  {submission.feedback}
                </div>
              </div>
            )}

            {!submission.feedback && (
              <div className="text-sm text-muted-foreground">
                No feedback provided.
              </div>
            )}

            {/* Dates */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                Submitted:{" "}
                {new Date(submission.submittedAt).toLocaleDateString()}
              </span>
              {submission.gradedAt && (
                <span>
                  Graded:{" "}
                  {new Date(submission.gradedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Graded assignments page
 */
export default function GradedAssignmentsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = React.useState<GradedSubmission[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const subRes = await fetch("/api/assignments/my-submissions")
        if (!subRes.ok) throw new Error("Failed to fetch submissions")

        const allSubmissions: GradedSubmission[] = await subRes.json()
        const graded = allSubmissions.filter((s) => s.grade !== null)

        setSubmissions(graded)
      } catch (err) {
        console.error("Failed to load graded submissions:", err)
        setError("Failed to load submissions")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading graded assignments...
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
            Error loading submissions
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
          Graded Assignments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Assignments with grades and feedback
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((sub) => {
            const grade = sub.grade ?? 0
            const maxPoints = sub.assignment.maxPoints
            const percentage = maxPoints > 0 ? (grade / maxPoints) * 100 : 0

            return (
              <Card key={sub.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1 text-base">
                        {sub.assignment.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {sub.assignment.course.title}
                      </CardDescription>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-xl font-bold ${
                          percentage >= 70
                            ? "text-green-600"
                            : percentage >= 40
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {grade.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        / {maxPoints}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      <span>{percentage.toFixed(0)}%</span>
                      <Badge
                        variant={
                          percentage >= 70 ? "default" : "secondary"
                        }
                        className="ml-auto"
                      >
                        {percentage >= 80
                          ? "Excellent"
                          : percentage >= 60
                            ? "Good"
                            : percentage >= 40
                              ? "Fair"
                              : "Needs Improvement"}
                      </Badge>
                    </div>

                    {sub.gradedAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Graded{" "}
                        {new Date(sub.gradedAt).toLocaleDateString()}
                      </div>
                    )}

                    <Separator />

                    <FeedbackDialog submission={sub} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No graded assignments
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Grades will appear here once your submissions are marked
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
