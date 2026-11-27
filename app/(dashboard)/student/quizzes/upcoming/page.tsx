"use client"

import * as React from "react"
import Link from "next/link"
import { CircleAlert, Clock, FileQuestion, BookOpen } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

/** GET /api/quizzes returns a wrapper object, not a bare array. */
interface QuizListResponse {
  quizzes?: QuizListItem[]
  pagination?: { total: number }
}

interface EnrolmentRow {
  courseId: string
}

interface AttemptRow {
  quizId: string
}

interface QuizListItem {
  id: string
  title: string
  description: string | null
  courseId: string
  timeLimit: number | null
  attemptsAllowed: number
  _count: { questions: number }
  course: { id: string; title: string }
}

function QuizCard({ quiz }: { quiz: QuizListItem }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1 text-base">{quiz.title}</CardTitle>
        <CardDescription className="mt-1 line-clamp-2">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="size-4" />
              <span>{quiz.course.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileQuestion className="size-4" />
              <span>{quiz._count.questions} questions</span>
            </div>
            {quiz.timeLimit && (
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>{quiz.timeLimit} min</span>
              </div>
            )}
          </div>
          <Button className="w-full" asChild>
            <Link href={`/student/quizzes/${quiz.id}`}>Start Quiz</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function UpcomingQuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = React.useState<QuizListItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        // GET /api/quizzes returns `{ quizzes, pagination }`, not a bare array.
        // The previous code did `quizResults.flat()`, which does not unwrap
        // object wrappers (flat only descends into arrays), so every element
        // stayed as `{ quizzes: [...] }`. `q.id` was therefore undefined, each
        // follow-up hit /api/quizzes/undefined/attempt and 404'd, and the page
        // then crashed in QuizCard on `quiz.course.title`.
        //
        // Attempt data now comes from the single batch endpoint
        // GET /api/quizzes/my-attempts instead of one request per quiz.
        const [enrolRes, attemptRes] = await Promise.all([
          apiGet<EnrolmentRow[]>("/enrolments/my"),
          apiGet<AttemptRow[]>("/quizzes/my-attempts"),
        ])

        const enrolments = enrolRes.data ?? []
        const courseIds = Array.from(
          new Set(enrolments.map((e) => e.courseId).filter(Boolean))
        )

        const quizResponses = await Promise.all(
          courseIds.map((cid) =>
            apiGet<QuizListResponse>(`/quizzes?courseId=${cid}`)
          )
        )

        const allQuizzes = quizResponses.flatMap((res) =>
          Array.isArray(res.data?.quizzes) ? res.data.quizzes : []
        )

        const attemptedIds = new Set(
          (attemptRes.data ?? []).map((a) => a.quizId).filter(Boolean)
        )

        setQuizzes(allQuizzes.filter((q) => !attemptedIds.has(q.id)))
      } catch (err) {
        console.error("Failed to load quizzes:", err)
        setError("Failed to load quizzes")
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
          <EmptyTitle>Error loading quizzes</EmptyTitle>
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
        title="Upcoming Quizzes"
        description="Quizzes you haven't attempted yet"
      />

      {quizzes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      ) : (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestion />
            </EmptyMedia>
            <EmptyTitle>No upcoming quizzes</EmptyTitle>
            <EmptyDescription>
              You&apos;ve attempted all available quizzes. Check back later for
              new ones.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/student/quizzes">View All Quizzes</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
