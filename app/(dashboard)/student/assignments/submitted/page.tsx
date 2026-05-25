/**
 * Student submitted assignments page
 * Shows assignments awaiting grading
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  BookOpen,
  Clock,
  Send,
  HelpCircle,
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
import { useAuth } from "@/components/auth-provider"

interface SubmissionData {
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
 * Submitted assignments page
 */
export default function SubmittedAssignmentsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = React.useState<SubmissionData[]>([])
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

        const allSubmissions: SubmissionData[] = await subRes.json()
        const awaitingGrade = allSubmissions.filter((s) => s.grade === null)

        setSubmissions(awaitingGrade)
      } catch (err) {
        console.error("Failed to load submissions:", err)
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
            Loading submissions...
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
          Submitted Assignments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Assignments awaiting grading
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((sub) => (
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
                  <Badge variant="secondary" className="shrink-0">
                    Awaiting Grade
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Send className="h-4 w-4" />
                    <span>
                      Submitted{" "}
                      {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {sub.assignment.maxPoints} points possible
                    </span>
                  </div>
                </div>
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
                No submissions awaiting grading
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                All your submissions have been graded
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
