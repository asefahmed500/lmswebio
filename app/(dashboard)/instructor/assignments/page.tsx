/**
 * Instructor assignments list page
 * Displays all assignments for the instructor's courses with stats and actions
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
  Clock,
  Search,
  TriangleAlert,
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
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiDelete } from "@/lib/api-client"
import type { Assignment } from "@/types"

interface AssignmentWithStats extends Assignment {
  submissionsCount?: number
  pendingGradingCount?: number
  courseTitle?: string
}

export default function InstructorAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = React.useState<AssignmentWithStats[]>(
    []
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadAssignments() {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await apiGet<{ assignments: AssignmentWithStats[] }>(
          "/assignments"
        )
        if (res.error) throw new Error(res.error)
        setAssignments(res.data!.assignments)
      } catch (error) {
        console.error("Failed to load assignments:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAssignments()
  }, [user])

  const handleDelete = async (id: string) => {
    try {
      const res = await apiDelete(`/assignments/${id}`)
      if (res.error) throw new Error(res.error)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error("Failed to delete assignment:", error)
    }
  }

  const filteredAssignments = React.useMemo(() => {
    if (!searchQuery) return assignments
    const q = searchQuery.toLowerCase()
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.courseTitle && a.courseTitle.toLowerCase().includes(q))
    )
  }, [assignments, searchQuery])

  const totalSubmissions = assignments.reduce(
    (sum, a) => sum + (a.submissionsCount || 0),
    0
  )
  const totalPendingGrading = assignments.reduce(
    (sum, a) => sum + (a.pendingGradingCount || 0),
    0
  )

  const header = (
    <PageHeader
      title="Assignments"
      description="Create and manage assignments for your courses"
      action={
        <Button asChild>
          <Link href="/instructor/assignments/new">
            <Plus data-icon="inline-start" />
            New Assignment
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
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <div className="text-2xl font-semibold">{assignments.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-info" />
              <div className="text-2xl font-semibold">{totalSubmissions}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-warning" />
              <div className="text-2xl font-semibold">
                {totalPendingGrading}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <InputGroup className="h-9 max-w-sm min-w-0 flex-1">
            <InputGroupInput
              type="search"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const isOverdue =
                    assignment.dueDate &&
                    new Date(assignment.dueDate) < new Date()
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {assignment.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.maxPoints} points
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {assignment.courseTitle ||
                            `Course #${assignment.courseId}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {assignment.dueDate ? (
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <TriangleAlert className="size-4 text-destructive" />
                            )}
                            <span className="text-sm">
                              {new Date(
                                assignment.dueDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No due date
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {assignment.submissionsCount || 0} total
                          </Badge>
                          {(assignment.pendingGradingCount || 0) > 0 && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-warning"
                            >
                              <Clock className="size-3" />
                              {assignment.pendingGradingCount} pending
                            </Badge>
                          )}
                        </div>
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
                                <Link
                                  href={`/instructor/assignments/${assignment.id}`}
                                >
                                  <FileText data-icon="inline-start" />
                                  View Submissions
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/instructor/assignments/${assignment.id}`}
                                >
                                  <Edit data-icon="inline-start" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteId(assignment.id)}
                              >
                                <Trash2 data-icon="inline-start" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No assignments found</EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Get started by creating your first assignment"}
                </EmptyDescription>
              </EmptyHeader>
              {!searchQuery && (
                <EmptyContent>
                  <Button asChild>
                    <Link href="/instructor/assignments/new">
                      <Plus data-icon="inline-start" />
                      Create Assignment
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
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action
              cannot be undone. All associated submissions will be permanently
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
