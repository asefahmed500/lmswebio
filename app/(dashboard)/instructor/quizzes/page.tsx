/**
 * Instructor quizzes list page
 * Displays all quizzes for the instructor's courses with stats and actions
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  HelpCircle,
  BarChart3,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface QuizWithStats extends Quiz {
  courseTitle?: string
  questionsCount?: number
  attemptsCount?: number
}

export default function InstructorQuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = React.useState<QuizWithStats[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  React.useEffect(() => {
    async function loadQuizzes() {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await fetch("/api/quizzes")
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

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete quiz")
      setQuizzes((prev) => prev.filter((q) => q.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error("Failed to delete quiz:", error)
    }
  }

  const filteredQuizzes = React.useMemo(() => {
    let filtered = [...quizzes]
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((q) => {
        if (statusFilter === "HAS_QUESTIONS") return (q.questionsCount ?? 0) > 0
        if (statusFilter === "NO_QUESTIONS") return (q.questionsCount ?? 0) === 0
        if (statusFilter === "HAS_ATTEMPTS") return (q.attemptsCount ?? 0) > 0
        return true
      })
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
  }, [quizzes, searchQuery, statusFilter])

  const totalQuestions = quizzes.reduce(
    (sum, q) => sum + (q.questionsCount || 0),
    0
  )
  const totalAttempts = quizzes.reduce(
    (sum, q) => sum + (q.attemptsCount || 0),
    0
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage quizzes for your courses
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/quizzes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Quiz
          </Link>
        </Button>
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
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold">{totalQuestions}</div>
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
              <Users className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">{totalAttempts}</div>
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
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Quizzes</SelectItem>
                <SelectItem value="HAS_QUESTIONS">Has Questions</SelectItem>
                <SelectItem value="NO_QUESTIONS">No Questions</SelectItem>
                <SelectItem value="HAS_ATTEMPTS">Has Attempts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuizzes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {quiz.timeLimit
                            ? `${quiz.timeLimit} min`
                            : "No time limit"}{" "}
                          &middot; {quiz.attemptsAllowed} attempt
                          {quiz.attemptsAllowed !== 1 ? "s" : ""} allowed
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
                        {quiz.questionsCount || 0} questions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {quiz.attemptsCount || 0} attempts
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/instructor/quizzes/${quiz.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/instructor/quizzes/results?quizId=${quiz.id}`}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Results
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(quiz.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No quizzes found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your filters or search query"
                  : "Get started by creating your first quiz"}
              </p>
              {!searchQuery && statusFilter === "ALL" && (
                <Button asChild>
                  <Link href="/instructor/quizzes/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quiz
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz? This action cannot be undone.
              All questions and student attempts will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
