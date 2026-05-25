/**
 * Student quiz overview page
 * Shows upcoming and completed quizzes across enrolled courses
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"

interface CourseInfo {
  id: number
  title: string
}

interface QuizListItem {
  id: number
  title: string
  description: string | null
  courseId: number
  timeLimit: number | null
  attemptsAllowed: number
  _count: { questions: number }
  course: CourseInfo
  bestScore?: number
  hasAttempted: boolean
}

/**
 * Quiz card component
 */
function QuizCard({ quiz }: { quiz: QuizListItem }) {
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
          {quiz.bestScore !== undefined && (
            <Badge
              variant={quiz.bestScore >= 70 ? "default" : "secondary"}
              className="shrink-0"
            >
              {quiz.bestScore.toFixed(0)}%
            </Badge>
          )}
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
            <div className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              <span>{quiz.attemptsAllowed} attempt{quiz.attemptsAllowed > 1 ? "s" : ""}</span>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link href={`/student/quizzes/${quiz.id}`}>
              {quiz.hasAttempted ? "Review Quiz" : "Start Quiz"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Quiz overview page component
 */
export default function StudentQuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = React.useState<QuizListItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("upcoming")

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

        const allQuizzes: QuizListItem[] = quizResults.flat()

        const attemptResults = await Promise.all(
          allQuizzes.map((q) =>
            fetch(`/api/quizzes/${q.id}/attempt`).then((r) =>
              r.ok ? r.json() : []
            )
          )
        )

        const quizWithAttempts = allQuizzes.map((q, i) => {
          const attempts: { score: number | null }[] = attemptResults[i] || []
          const scores = attempts
            .map((a) => a.score)
            .filter((s): s is number => s !== null)
          return {
            ...q,
            hasAttempted: attempts.length > 0,
            bestScore: scores.length > 0 ? Math.max(...scores) : undefined,
          }
        })

        setQuizzes(quizWithAttempts)
      } catch (err) {
        console.error("Failed to load quizzes:", err)
        setError("Failed to load quizzes")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  const upcomingQuizzes = React.useMemo(
    () => quizzes.filter((q) => !q.hasAttempted),
    [quizzes]
  )

  const completedQuizzes = React.useMemo(
    () => quizzes.filter((q) => q.hasAttempted),
    [quizzes]
  )

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
        <h1 className="text-3xl font-bold tracking-tight">My Quizzes</h1>
        <p className="mt-1 text-muted-foreground">
          View and take quizzes for your enrolled courses
        </p>
      </div>

      {quizzes.length > 0 ? (
        <Tabs
          defaultValue="upcoming"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingQuizzes.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedQuizzes.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            {upcomingQuizzes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingQuizzes.map((quiz) => (
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
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve completed all available quizzes
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-6">
            {completedQuizzes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedQuizzes.map((quiz) => (
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
                    <p className="text-sm text-muted-foreground">
                      Take a quiz to see your results here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No quizzes found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Quizzes from your enrolled courses will appear here
              </p>
              <Button asChild>
                <Link href="/student/courses/catalogue">Browse Courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
