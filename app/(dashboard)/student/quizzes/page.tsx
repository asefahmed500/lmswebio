/**
 * Student quiz overview page
 * Shows upcoming and completed quizzes across enrolled courses
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  CircleAlert,
  Clock,
  FileQuestion,
  BookOpen,
  ListChecks,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface CourseInfo {
  id: string
  title: string
}

interface QuizListItem {
  id: string
  title: string
  description: string | null
  courseId: string
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
          <div className="min-w-0 flex-1">
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
            <div className="flex items-center gap-1">
              <ListChecks className="size-4" />
              <span>
                {quiz.attemptsAllowed} attempt
                {quiz.attemptsAllowed > 1 ? "s" : ""}
              </span>
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
        const enrolRes = await apiGet<{ courseId: string }[]>("/enrolments/my")
        if (enrolRes.error || !enrolRes.data)
          throw new Error("Failed to fetch enrollments")
        const enrolments = enrolRes.data

        const courseIds = enrolments.map(
          (e: { courseId: string }) => e.courseId
        )

        // Fixed: API returns { quizzes: [...] }, not array directly
        const quizResults = await Promise.all(
          courseIds.map((cid: string) =>
            apiGet<{ quizzes: QuizListItem[] }>(
              `/quizzes?courseId=${cid}`
            ).then((r) => r.data?.quizzes ?? [])
          )
        )

        const allQuizzes: QuizListItem[] = quizResults.flat()

        const attemptsRes = await apiGet<
          { quizId: string; score: number | null }[]
        >("/quizzes/my-attempts")
        const attempts = attemptsRes.data ?? []

        const attemptsByQuiz: Record<string, { score: number | null }[]> = {}
        for (const a of attempts) {
          if (!attemptsByQuiz[a.quizId]) attemptsByQuiz[a.quizId] = []
          attemptsByQuiz[a.quizId].push(a)
        }

        const quizWithAttempts = allQuizzes.map((q) => {
          const quizAttempts = attemptsByQuiz[q.id] || []
          const scores = quizAttempts
            .map((a: { score: number | null }) => a.score)
            .filter((s: number | null): s is number => s !== null)
          return {
            ...q,
            hasAttempted: quizAttempts.length > 0,
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
        title="My Quizzes"
        description="View and take quizzes for your enrolled courses"
      />

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
              <Empty className="rounded-lg border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileQuestion />
                  </EmptyMedia>
                  <EmptyTitle>No upcoming quizzes</EmptyTitle>
                  <EmptyDescription>
                    You&apos;ve completed all available quizzes
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
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
              <Empty className="rounded-lg border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Trophy />
                  </EmptyMedia>
                  <EmptyTitle>No completed quizzes</EmptyTitle>
                  <EmptyDescription>
                    Take a quiz to see your results here
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>No quizzes found</EmptyTitle>
            <EmptyDescription>
              Quizzes from your enrolled courses will appear here
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/student/courses/catalogue">Browse Courses</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
