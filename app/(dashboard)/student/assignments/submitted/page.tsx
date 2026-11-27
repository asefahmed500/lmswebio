"use client"

import * as React from "react"
import Link from "next/link"
import { Clock, Send, CircleAlert, CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingCard } from "@/components/loading-skeleton"
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
import { apiGet } from "@/lib/api-client"

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
        const subResult = await apiGet<SubmissionData[]>(
          "/assignments/my-submissions"
        )
        if (subResult.error) throw new Error("Failed to fetch submissions")

        const allSubmissions = subResult.data!
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
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <EmptyTitle>Error loading submissions</EmptyTitle>
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
        title="Submitted Assignments"
        description="Assignments awaiting grading"
      />

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
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Send className="size-4" />
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
                    <Clock className="size-4" />
                    <span>{sub.assignment.maxPoints} points possible</span>
                  </div>
                </div>
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
            <EmptyTitle>No submissions awaiting grading</EmptyTitle>
            <EmptyDescription>
              All your submissions have been graded
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
