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
  Search,
  ArrowUpRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
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
        const res = await fetch("/api/quizzes?includeResults=true")
        if (!res.ok) throw new Error("Failed to fetch quizzes")
        const data = await res.json()
        setQuizzes(data)
      } catch (error) {
        console.error("Failed to load quizzes:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuizzes()
  }, [user])

  const uniqueCourses = React.useMemo(() => {
    const courseMap = new Map<number, string>()
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
      filtered = filtered.filter(
        (q) => q.courseId === Number(courseFilter)
      )
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (qz) =>
          qz.title.toLowerCase().includes(q) ||
          (qz.courseTitle &&
            qz.courseTitle.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [quizzes, searchQuery, courseFilter])

  const totalAttempts = quizzes.reduce(
    (sum, q) => sum + (q.attemptsCount || 0),
    0
  )
  const avgScoreAll =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce(
            (sum, q) => sum + (q.averageScore || 0),
            0
          ) / quizzes.length
        )
      : 0
  const quizzesWithAttempts = quizzes.filter(
    (q) => (q.attemptsCount || 0) > 0
  ).length

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading results...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quiz Results</h1>
        <p className="mt-1 text-muted-foreground">
          View combined results and performance across all quizzes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{quizzes.length}</div>
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
              <Users className="h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold">{totalAttempts}</div>
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
              <BarChart3 className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">{quizzesWithAttempts}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm flex-1">
              <Input
                type="search"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={courseFilter}
              onValueChange={(value) => setCourseFilter(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Courses</SelectItem>
                {uniqueCourses.map((course) => (
                  <SelectItem
                    key={course.id}
                    value={String(course.id)}
                  >
                    {course.title}
                  </SelectItem>
                ))}
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
                        <p className="truncate font-medium">
                          {quiz.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {quiz.questionsCount || 0} questions
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {quiz.courseTitle ||
                          `Course #${quiz.courseId}`}
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
                            className={`h-4 w-4 ${
                              (quiz.averageScore ?? 0) >= 50
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              (quiz.averageScore ?? 0) >= 50
                                ? "text-green-600"
                                : "text-red-600"
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
                        <Link
                          href={`/instructor/quizzes/${quiz.id}`}
                        >
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No results found
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery || courseFilter !== "ALL"
                  ? "Try adjusting your filters or search query"
                  : "No quiz results available yet. Create quizzes and wait for students to attempt them."}
              </p>
              {!searchQuery && courseFilter === "ALL" && (
                <Button asChild>
                  <Link href="/instructor/quizzes/new">
                    Create Quiz
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
