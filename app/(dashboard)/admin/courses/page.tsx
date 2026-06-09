"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Search, Eye, Trash2, Loader2, Library } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { apiPatch, apiDelete } from "@/lib/api-client"

interface AdminCourse {
  id: string
  title: string
  slug: string
  thumbnail?: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  isPublished: boolean
  instructorId: string
  instructor?: { fullName: string; avatarUrl?: string }
  _count?: { students: number }
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
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((data) => {
        if (!cancelled)
          setCourses(Array.isArray(data) ? data : data.courses || [])
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load courses")
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <p className="mt-1 text-muted-foreground">
          Manage all courses on the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Total Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-success flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-success text-3xl font-bold">
              {stats.published}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-warning text-3xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="BEGINNER">Beginner</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
            <SelectItem value="ADVANCED">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm text-muted-foreground">
              {search || levelFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your search or filters"
                : "No courses have been created yet"}
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
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={course.instructor?.avatarUrl} />
                          <AvatarFallback className="text-[10px]">
                            {course.instructor
                              ? getInitials(course.instructor.fullName)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
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
                      {course._count?.students ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" asChild>
                          <Link href={`/admin/courses/${course.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleTogglePublish(course)}
                        >
                          {course.isPublished ? (
                            <BookOpen className="text-warning h-3.5 w-3.5" />
                          ) : (
                            <BookOpen className="text-success h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
