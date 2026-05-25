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
  CheckCircle,
  AlertCircle,
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
import { useAuth } from "@/components/auth-provider"
import type { Assignment } from "@/types"

interface AssignmentWithStats extends Assignment {
  submissionsCount?: number
  pendingGradingCount?: number
  courseTitle?: string
}

export default function InstructorAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = React.useState<AssignmentWithStats[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  React.useEffect(() => {
    async function loadAssignments() {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await fetch("/api/assignments")
        if (!res.ok) throw new Error("Failed to fetch assignments")
        const data = await res.json()
        setAssignments(data)
      } catch (error) {
        console.error("Failed to load assignments:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAssignments()
  }, [user])

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete assignment")
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage assignments for your courses
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/assignments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{assignments.length}</div>
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
              <Users className="h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold">{totalSubmissions}</div>
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
              <Clock className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">{totalPendingGrading}</div>
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
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
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
                          {assignment.courseTitle || `Course #${assignment.courseId}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {assignment.dueDate ? (
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-sm">
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {assignment.submissionsCount || 0} total
                          </Badge>
                          {(assignment.pendingGradingCount || 0) > 0 && (
                            <Badge variant="outline" className="gap-1 text-amber-600">
                              <Clock className="h-3 w-3" />
                              {assignment.pendingGradingCount} pending
                            </Badge>
                          )}
                        </div>
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
                              <Link href={`/instructor/assignments/${assignment.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Submissions
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/instructor/assignments/${assignment.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(assignment.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No assignments found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by creating your first assignment"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/instructor/assignments/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assignment
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
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
              All associated submissions will be permanently removed.
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
