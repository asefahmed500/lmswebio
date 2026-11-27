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
  ListChecks,
  BarChart3,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { apiGet, apiDelete } from "@/lib/api-client"
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
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadQuizzes() {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await apiGet<{ quizzes: QuizWithStats[] }>("/quizzes")
        if (res.error) throw new Error(res.error)
        setQuizzes(res.data!.quizzes)
      } catch (error) {
        console.error("Failed to load quizzes:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuizzes()
  }, [user])

  const handleDelete = async (id: string) => {
    try {
      const res = await apiDelete(`/quizzes/${id}`)
      if (res.error) throw new Error(res.error)
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
        if (statusFilter === "NO_QUESTIONS")
          return (q.questionsCount ?? 0) === 0
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

  const header = (
    <PageHeader
      title="Quizzes"
      description="Create and manage quizzes for your courses"
      action={
        <Button asChild>
          <Link href="/instructor/quizzes/new">
            <Plus data-icon="inline-start" />
            New Quiz
          </Link>
        </Button>
      }
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
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ListChecks className="size-5 text-info" />
              <div className="text-2xl font-semibold">{totalQuestions}</div>
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
              <Users className="size-5 text-warning" />
              <div className="text-2xl font-semibold">{totalAttempts}</div>
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
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All Quizzes</SelectItem>
                  <SelectItem value="HAS_QUESTIONS">Has Questions</SelectItem>
                  <SelectItem value="NO_QUESTIONS">No Questions</SelectItem>
                  <SelectItem value="HAS_ATTEMPTS">Has Attempts</SelectItem>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="More actions"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href={`/instructor/quizzes/${quiz.id}`}>
                                <Edit data-icon="inline-start" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/instructor/quizzes/results?quizId=${quiz.id}`}
                              >
                                <BarChart3 data-icon="inline-start" />
                                View Results
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteId(quiz.id)}
                            >
                              <Trash2 data-icon="inline-start" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No quizzes found</EmptyTitle>
                <EmptyDescription>
                  {searchQuery || statusFilter !== "ALL"
                    ? "Try adjusting your filters or search query"
                    : "Get started by creating your first quiz"}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && statusFilter === "ALL" && (
                <EmptyContent>
                  <Button asChild>
                    <Link href="/instructor/quizzes/new">
                      <Plus data-icon="inline-start" />
                      Create Quiz
                    </Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz? This action cannot be
              undone. All questions and student attempts will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
