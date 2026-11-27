/**
 * Quiz results page
 * Displays combined results of all quiz attempts across courses
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  BarChart3,
  Users,
  TrendingUp,
  ArrowUpRight,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import type { Quiz } from "@/types"

interface QuizWithResults extends Quiz {
  courseTitle?: string
  questionsCount?: number
  attemptsCount?: number
  averageScore?: number
}

export default function QuizResultsPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = React.useState<QuizWithResults[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState<string>("ALL")

  React.useEffect(() => {
    async function loadQuizzes() {
      if (!user) return
      setIsLoading(true)
      try {
        const result = await apiGet<{ quizzes: QuizWithResults[] }>(
          "/quizzes?includeResults=true"
        )
        if (result.error) throw new Error(result.error)
        setQuizzes(result.data?.quizzes ?? [])
      } catch (error) {
        console.error("Failed to load quizzes:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuizzes()
  }, [user])

  const uniqueCourses = React.useMemo(() => {
    const courseMap = new Map<string, string>()
    quizzes.forEach((q) => {
      if (q.courseId && q.courseTitle) {
        courseMap.set(q.courseId, q.courseTitle)
      }
    })
    return Array.from(courseMap.entries()).map(([id, title]) => ({
      id,
      title,
    }))
  }, [quizzes])

  const filteredQuizzes = React.useMemo(() => {
    let filtered = [...quizzes]
    if (courseFilter !== "ALL") {
      filtered = filtered.filter((q) => q.courseId === courseFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (qz) =>
          qz.title.toLowerCase().includes(q) ||
          (qz.courseTitle && qz.courseTitle.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [quizzes, searchQuery, courseFilter])

  const totalAttempts = quizzes.reduce(
    (sum, q) => sum + (q.attemptsCount || 0),
    0
  )
  const quizzesWithAttempts = quizzes.filter(
    (q) => (q.attemptsCount || 0) > 0
  ).length

  const header = (
    <PageHeader
      title="Quiz Results"
      description="View combined results and performance across all quizzes"
    />
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {header}
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingCard count={3} />
        </div>
        <LoadingCard />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {header}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <div className="text-2xl font-semibold">{quizzes.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-info" />
              <div className="text-2xl font-semibold">{totalAttempts}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quizzes with Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5 text-warning" />
              <div className="text-2xl font-semibold">
                {quizzesWithAttempts}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <InputGroup className="h-9 max-w-sm min-w-0 flex-1">
              <InputGroupInput
                type="search"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <Select
              value={courseFilter}
              onValueChange={(value) => setCourseFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All Courses</SelectItem>
                  {uniqueCourses.map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuizzes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Total Attempts</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead className="w-[130px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {quiz.questionsCount || 0} questions
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {quiz.courseTitle || `Course #${quiz.courseId}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {quiz.attemptsCount || 0} attempts
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(quiz.attemptsCount ?? 0) > 0 ? (
                        <div className="flex items-center gap-2">
                          <TrendingUp
                            className={`size-4 ${
                              (quiz.averageScore ?? 0) >= 50
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              (quiz.averageScore ?? 0) >= 50
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {quiz.averageScore ?? 0}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No data
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/instructor/quizzes/${quiz.id}`}>
                          <ArrowUpRight data-icon="inline-start" />
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3 />
                </EmptyMedia>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>
                  {searchQuery || courseFilter !== "ALL"
                    ? "Try adjusting your filters or search query"
                    : "No quiz results available yet. Create quizzes and wait for students to attempt them."}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && courseFilter === "ALL" && (
                <EmptyContent>
                  <Button asChild>
                    <Link href="/instructor/quizzes/new">Create Quiz</Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
