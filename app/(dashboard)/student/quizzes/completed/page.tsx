"use client"

import * as React from "react"
import Link from "next/link"
import {
  CircleAlert,
  Clock,
  FileQuestion,
  BookOpen,
  Trophy,
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
  quizzes?: CompletedQuiz[]
  pagination?: { total: number }
}

interface EnrolmentRow {
  courseId: string
}

interface AttemptRow {
  quizId: string
  score: number | null
}

interface CompletedQuiz {
  id: string
  title: string
  description: string | null
  courseId: string
  timeLimit: number | null
  attemptsAllowed: number
  _count: { questions: number }
  course: { id: string; title: string }
  bestScore: number
  attemptCount: number
}

function QuizCard({ quiz }: { quiz: CompletedQuiz }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-1 text-base">
              {quiz.title}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {quiz.description}
            </CardDescription>
          </div>
          <Badge
            variant={quiz.bestScore >= 70 ? "default" : "secondary"}
            className="shrink-0 text-sm"
          >
            {quiz.bestScore.toFixed(0)}%
          </Badge>
        </div>
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
            <span className="text-xs text-muted-foreground">
              {quiz.attemptCount}/{quiz.attemptsAllowed} attempts
            </span>
          </div>
          <Button className="w-full" variant="outline" asChild>
            <Link href={`/student/quizzes/${quiz.id}`}>Review Results</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CompletedQuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = React.useState<CompletedQuiz[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        // GET /api/quizzes returns `{ quizzes, pagination }`, so the previous
        // `quizResults.flat()` left `{ quizzes: [...] }` wrappers in place
        // (flat only descends into arrays). q.id was undefined, every
        // /api/quizzes/undefined/attempt request 404'd, and the page always
        // rendered "No completed quizzes" even after a pass.
        //
        // Attempts now come from the batch endpoint GET /api/quizzes/my-attempts.
        const [enrolRes, attemptRes] = await Promise.all([
          apiGet<EnrolmentRow[]>("/enrolments/my"),
          apiGet<AttemptRow[]>("/quizzes/my-attempts"),
        ])

        const courseIds = Array.from(
          new Set((enrolRes.data ?? []).map((e) => e.courseId).filter(Boolean))
        )

        const quizResponses = await Promise.all(
          courseIds.map((cid) =>
            apiGet<QuizListResponse>(`/quizzes?courseId=${cid}`)
          )
        )

        const allQuizzes = quizResponses.flatMap((res) =>
          Array.isArray(res.data?.quizzes) ? res.data.quizzes : []
        )

        const byQuiz = new Map<string, { score: number | null }[]>()
        for (const attempt of attemptRes.data ?? []) {
          if (!attempt.quizId) continue
          const list = byQuiz.get(attempt.quizId) ?? []
          list.push({ score: attempt.score })
          byQuiz.set(attempt.quizId, list)
        }

        const completed: CompletedQuiz[] = []
        for (const quiz of allQuizzes) {
          const attempts = byQuiz.get(quiz.id)
          if (!attempts || attempts.length === 0) continue
          const scores = attempts
            .map((a) => a.score)
            .filter((s): s is number => s !== null)
          completed.push({
            ...quiz,
            bestScore: scores.length > 0 ? Math.max(...scores) : 0,
            attemptCount: attempts.length,
          })
        }

        setQuizzes(completed)
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
        title="Completed Quizzes"
        description="Quizzes you've attempted with your best scores"
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
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>No completed quizzes</EmptyTitle>
            <EmptyDescription>
              Take a quiz and come back to see your results here
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
