"use client"

import * as React from "react"
import {
  HelpCircle,
  Search,
  Loader2,
  Trash2,
  Clock,
  ListChecks,
  CheckCircle2,
  Layers,
} from "lucide-react"
import { toast } from "sonner"
import { apiDelete } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface QuizItem {
  id: string
  title: string
  description?: string
  timeLimit?: number
  attemptsAllowed: number
  courseId: string
  course?: { id: string; title: string }
  _count?: { questions: number }
  createdAt: string
}

interface CourseOption {
  id: string
  title: string
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = React.useState<QuizItem[]>([])
  const [courses, setCourses] = React.useState<CourseOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState("ALL")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/quizzes").then((r) => (r.ok ? r.json() : { quizzes: [] })),
      fetch("/api/courses?limit=100").then((r) =>
        r.ok ? r.json() : { courses: [] }
      ),
    ])
      .then(([quizData, courseData]) => {
        if (!cancelled) {
          setQuizzes(quizData.quizzes || [])
          setCourses(
            Array.isArray(courseData) ? courseData : courseData.courses || []
          )
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load data")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const result = await apiDelete(`/quizzes/${deleteId}`)
      if (!result.error) {
        setQuizzes((prev) => prev.filter((q) => q.id !== deleteId))
        toast.success("Quiz deleted")
      } else {
        toast.error(result.error || "Failed to delete quiz")
      }
    } catch {
      toast.error("Failed to delete quiz")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesCourse =
      courseFilter === "ALL" || quiz.courseId === courseFilter
    return matchesSearch && matchesCourse
  })

  const stats = {
    total: quizzes.length,
    totalQuestions: quizzes.reduce(
      (sum, q) => sum + (q._count?.questions ?? 0),
      0
    ),
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
        <p className="mt-1 text-muted-foreground">
          Manage all quizzes across the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-4" />
              Total Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="size-4" />
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalQuestions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={String(course.id)}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HelpCircle className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No quizzes found</p>
            <p className="text-sm text-muted-foreground">
              {search || courseFilter !== "ALL"
                ? "Try adjusting your search or filters"
                : "No quizzes have been created yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time Limit</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        {quiz.description && (
                          <p className="max-w-xs truncate text-xs text-muted-foreground">
                            {quiz.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {quiz.course?.title ?? `Course #${quiz.courseId}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {quiz.attemptsAllowed}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        {quiz._count?.questions ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteId(quiz.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz? All associated
              questions and attempts will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
