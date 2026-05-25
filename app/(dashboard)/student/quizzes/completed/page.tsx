/**
 * Student completed quizzes page
 * Shows quizzes the student has attempted with best scores
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { Clock, FileQuestion, BookOpen, HelpCircle, Trophy } from "lucide-react"
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

interface CompletedQuiz {
  id: number
  title: string
  description: string | null
  courseId: number
  timeLimit: number | null
  attemptsAllowed: number
  _count: { questions: number }
  course: { id: number; title: string }
  bestScore: number
  attemptCount: number
}

/**
 * Completed quiz card
 */
function QuizCard({ quiz }: { quiz: CompletedQuiz }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
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
        <div className="space-y-3">
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

/**
 * Completed quizzes page
 */
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
        const enrolRes = await fetch("/api/enrolments/my")
        if (!enrolRes.ok) throw new Error("Failed to fetch enrollments")
        const enrolments = await enrolRes.json()

        const courseIds = enrolments.map(
          (e: { courseId: number }) => e.courseId
        )

        const quizResults = await Promise.all(
          courseIds.map((cid: number) =>
            fetch(`/api/quizzes?courseId=${cid}`).then((r) =>
              r.ok ? r.json() : []
            )
          )
        )

        const allQuizzes: CompletedQuiz[] = quizResults.flat()

        const attemptResults = await Promise.all(
          allQuizzes.map((q) =>
            fetch(`/api/quizzes/${q.id}/attempt`).then((r) =>
              r.ok ? r.json() : []
            )
          )
        )

        const completed = allQuizzes
          .map((q, i) => {
            const attempts: { score: number | null }[] =
              attemptResults[i] || []
            if (attempts.length === 0) return null
            const scores = attempts
              .map((a) => a.score)
              .filter((s): s is number => s !== null)
            return {
              ...q,
              bestScore: scores.length > 0 ? Math.max(...scores) : 0,
              attemptCount: attempts.length,
            }
          })
          .filter((q): q is CompletedQuiz => q !== null)

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Completed Quizzes</h1>
        <p className="mt-1 text-muted-foreground">
          Quizzes you&apos;ve attempted with your best scores
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
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No completed quizzes
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Take a quiz and come back to see your results here
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
