"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Search,
  Eye,
  Trash2,
  Library,
  CircleCheck,
  Circle,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  SelectGroup,
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
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client"

interface AdminCourse {
  id: string
  title: string
  slug: string
  thumbnail?: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  isPublished: boolean
  instructorId: string
  instructor?: { fullName: string; avatarUrl?: string }
  _count?: { enrolments: number }
  createdAt: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = React.useState<AdminCourse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [levelFilter, setLevelFilter] = React.useState("ALL")
  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    apiGet<{ courses: AdminCourse[] }>("/courses")
      .then((result) => {
        if (!cancelled && !result.error && result.data)
          setCourses(result.data.courses || [])
        else if (!cancelled) toast.error("Failed to load courses")
      })
      .finally(() => {
        if (!cancelled) {
          const params = new URLSearchParams(window.location.search)
          const q = params.get("q") || params.get("search")
          if (q) setSearch(q)
          setIsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleTogglePublish(course: AdminCourse) {
    try {
      const res = await apiPatch(`/courses/${course.id}`, {
        isPublished: !course.isPublished,
      })
      if (!res.error) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, isPublished: !c.isPublished } : c
          )
        )
        toast.success(
          `${course.title} ${course.isPublished ? "unpublished" : "published"}`
        )
      } else {
        toast.error("Failed to update course")
      }
    } catch {
      toast.error("Failed to update course")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await apiDelete(`/courses/${deleteId}`)
      if (!res.error) {
        setCourses((prev) => prev.filter((c) => c.id !== deleteId))
        toast.success("Course deleted")
      } else {
        toast.error("Failed to delete course")
      }
    } catch {
      toast.error("Failed to delete course")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesLevel = levelFilter === "ALL" || course.level === levelFilter
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && course.isPublished) ||
      (statusFilter === "DRAFT" && !course.isPublished)
    return matchesSearch && matchesLevel && matchesStatus
  })

  const stats = {
    total: courses.length,
    published: courses.filter((c) => c.isPublished).length,
    draft: courses.filter((c) => !c.isPublished).length,
  }

  function getLevelVariant(level: string) {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      BEGINNER: "default",
      INTERMEDIATE: "secondary",
      ADVANCED: "outline",
    }
    return variants[level] || "outline"
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) return <PageLoading label="Loading courses…" />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Courses"
        description="Manage all courses on the platform"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Total Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <BookOpen className="h-4 w-4" />
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-success">
              {stats.published}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <BookOpen className="h-4 w-4" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">
              {stats.draft}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InputGroup className="h-9 flex-1">
          <InputGroupInput
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>No courses found</EmptyTitle>
                <EmptyDescription>
                  {search || levelFilter !== "ALL" || statusFilter !== "ALL"
                    ? "Try adjusting your search or filters"
                    : "No courses have been created yet"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Instructor
                  </TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Students
                  </TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{course.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {course.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="size-6 shrink-0">
                          <AvatarImage src={course.instructor?.avatarUrl} />
                          <AvatarFallback>
                            {course.instructor
                              ? getInitials(course.instructor.fullName)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">
                          {course.instructor?.fullName ?? "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelVariant(course.level)}>
                        {course.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {course._count?.enrolments ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" asChild>
                          <Link href={`/admin/courses/${course.id}`}>
                            <Eye />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleTogglePublish(course)}
                          aria-label={
                            course.isPublished
                              ? "Unpublish course"
                              : "Publish course"
                          }
                        >
                          {course.isPublished ? (
                            <CircleCheck className="text-success" />
                          ) : (
                            <Circle className="text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteId(course.id)}
                          aria-label="Delete course"
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
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
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be
              undone.
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
