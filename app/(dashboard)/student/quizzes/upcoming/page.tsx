"use client"

import * as React from "react"
import Link from "next/link"
import { Clock, FileQuestion, BookOpen, HelpCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
              <BookOpen className="h-4 w-4" />
              <span>{quiz.course.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileQuestion className="h-4 w-4" />
              <span>{quiz._count.questions} questions</span>
            </div>
            {quiz.timeLimit && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
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
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">Error loading quizzes</h3>
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Upcoming Quizzes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quizzes you haven&apos;t attempted yet
        </p>
      </div>

      {quizzes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <FileQuestion className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No upcoming quizzes
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                You&apos;ve attempted all available quizzes. Check back later
                for new ones.
              </p>
              <Button asChild>
                <Link href="/student/quizzes">View All Quizzes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
