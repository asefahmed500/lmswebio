/**
 * Instructor courses list page
 * Displays all courses for the current instructor with status filters
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
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

type CourseStatus = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED"

interface ApiCourse {
  id: number
  title: string
  description: string | null
  level: string
  thumbnail: string | null
  isPublished: boolean
  category: string | null
  modules: Array<{
    id: number
    title: string
    lessons: Array<{ id: number }>
  }>
}

/**
 * Instructor courses list page component
 */
export default function InstructorCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = React.useState<ApiCourse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<CourseStatus>("ALL")
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [enrollmentStats, setEnrollmentStats] = React.useState<Record<number, { count: number; avgProgress: number }>>({})

  // Load courses with enrollment stats
  React.useEffect(() => {
    async function loadCourses() {
      if (!user) return

      setIsLoading(true)
      try {
        const res = await fetch("/api/courses")
        if (!res.ok) throw new Error("Failed to fetch courses")
        const data = await res.json()
        const courseList = Array.isArray(data) ? data : data.courses || []
        setCourses(courseList)

        // Load enrollment stats per course
        const stats: Record<number, { count: number; avgProgress: number }> = {}
        await Promise.all(
          courseList.map(async (course: ApiCourse) => {
            try {
              const enrRes = await fetch(`/api/enrollments?courseId=${course.id}`)
              if (enrRes.ok) {
                const enrData = await enrRes.json()
                const enrollments = Array.isArray(enrData) ? enrData : enrData.enrollments || []
                const count = enrollments.length
                const avgProgress = count > 0
                  ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / count)
                  : 0
                stats[course.id] = { count, avgProgress }
              }
            } catch {
              stats[course.id] = { count: 0, avgProgress: 0 }
            }
          })
        )
        setEnrollmentStats(stats)
      } catch (error) {
        console.error("Failed to load courses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCourses()
  }, [user])

  // Filter courses
  const filteredCourses = React.useMemo(() => {
    let filtered = [...courses]

    if (statusFilter !== "ALL") {
      if (statusFilter === "PUBLISHED") {
        filtered = filtered.filter((c) => c.isPublished)
      } else if (statusFilter === "DRAFT") {
        filtered = filtered.filter((c) => !c.isPublished)
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [courses, statusFilter, searchQuery])

  /**
   * Handle course status toggle (publish/unpublish)
   */
  const handleStatusToggle = async (id: number) => {
    const course = courses.find((c) => c.id === id)
    if (!course) return

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      })
      if (!res.ok) throw new Error("Failed to update course")
      const updated = await res.json()
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      )
    } catch (error) {
      console.error("Failed to toggle publish status:", error)
    }
  }

  /**
   * Handle course deletion
   */
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete course")
      setCourses((prev) => prev.filter((c) => c.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error("Failed to delete course:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and organize your course content
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.filter((c) => c.isPublished).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.filter((c) => !c.isPublished).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce((sum, c) => sum + c.modules.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm flex-1">
              <Input
                type="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as CourseStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Courses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Drafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCourses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => {
                  const stats = enrollmentStats[course.id] || { count: 0, avgProgress: 0 }
                  const totalLessons = course.modules.reduce(
                    (sum, m) => sum + m.lessons.length,
                    0
                  )
                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                            {course.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{course.title}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {course.modules.length} modules • {totalLessons} lessons
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            course.level === "BEGINNER"
                              ? "secondary"
                              : course.level === "INTERMEDIATE"
                                ? "default"
                                : "outline"
                          }
                        >
                          {course.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{stats.count} students</p>
                          <p className="text-muted-foreground">{stats.avgProgress}% avg progress</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={course.isPublished ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {course.isPublished ? (
                            <>
                              <Eye className="h-3 w-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Draft
                            </>
                          )}
                        </Badge>
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
                              <Link href={`/instructor/courses/${course.id}`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/instructor/courses/${course.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Course
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusToggle(course.id)}>
                              {course.isPublished ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(course.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Course
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
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your filters or search query"
                  : "Get started by creating your first course"}
              </p>
              {!searchQuery && statusFilter === "ALL" && (
                <Button asChild>
                  <Link href="/instructor/courses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
              All modules, lessons, and associated data will be permanently removed.
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
