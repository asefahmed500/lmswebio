"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, FileText, Loader2 } from "lucide-react"
import { apiGet } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">
            Browse all quiz questions across courses
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quizzes.length}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQuestions}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Courses with Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quizzes or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 size-4" />
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(([id, title]) => (
              <SelectItem key={id} value={id}>
                {title}
              </SelectItem>
            ))}
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
            <div className="py-8 text-center text-muted-foreground">
              {quizzes.length === 0
                ? "No quizzes found. Create quizzes from the Quizzes page."
                : "No questions match your search."}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.course.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <Badge variant="outline">
                      {quiz._count.questions} question
                      {quiz._count.questions !== 1 ? "s" : ""}
                    </Badge>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
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
