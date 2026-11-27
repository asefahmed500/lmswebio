"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, FileText } from "lucide-react"
import { apiGet } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { PageLoading } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Quiz {
  id: number
  title: string
  course: { id: number; title: string }
  _count: { questions: number }
  isActive: boolean
}

export default function QuestionBankPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = React.useState<Quiz[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState("all")

  React.useEffect(() => {
    async function load() {
      const result = await apiGet<Quiz[]>("/quizzes")
      if (result.data) {
        setQuizzes(
          (Array.isArray(result.data)
            ? result.data
            : (result.data as Record<string, unknown>).quizzes
              ? ((result.data as Record<string, unknown>).quizzes as Quiz[])
              : []) as Quiz[]
        )
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const totalQuestions = quizzes.reduce((sum, q) => sum + q._count.questions, 0)

  const courses = React.useMemo(() => {
    const map = new Map<string, string>()
    quizzes.forEach((q) => map.set(String(q.course.id), q.course.title))
    return Array.from(map.entries())
  }, [quizzes])

  const filtered = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCourse =
      courseFilter === "all" || String(q.course.id) === courseFilter
    return matchesSearch && matchesCourse && q._count.questions > 0
  })

  const filteredQuestions = filtered.reduce(
    (sum, q) => sum + q._count.questions,
    0
  )

  if (isLoading) return <PageLoading label="Loading question bank…" />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Question Bank"
        description="Browse all quiz questions across courses"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {quizzes.length}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {totalQuestions}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Courses with Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {courses.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InputGroup className="h-9 max-w-sm flex-1">
          <InputGroupInput
            placeholder="Search quizzes or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 size-4" />
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(([id, title]) => (
                <SelectItem key={id} value={id}>
                  {title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Questions by Quiz ({filteredQuestions} questions in{" "}
            {filtered.length} quizzes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No questions found</EmptyTitle>
                <EmptyDescription>
                  {quizzes.length === 0
                    ? "No quizzes found. Create quizzes from the Quizzes page."
                    : "No questions match your search."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{quiz.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {quiz.course.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <Badge variant="outline">
                      {quiz._count.questions} question
                      {quiz._count.questions !== 1 ? "s" : ""}
                    </Badge>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">
                        {quiz._count.questions}
                      </p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/admin/quizzes")}
                    >
                      View Quiz
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
