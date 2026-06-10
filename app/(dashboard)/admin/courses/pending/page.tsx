"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Eye,
  Loader2,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { apiPatch, apiDelete } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
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

interface PendingCourse {
  id: string
  title: string
  slug: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  isPublished: boolean
  instructorId: string
  instructor?: { id: string; fullName: string; avatarUrl?: string }
  _count?: { modules: number; enrolments: number }
  createdAt: string
}

export default function AdminPendingCoursesPage() {
  const [courses, setCourses] = React.useState<PendingCourse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [levelFilter, setLevelFilter] = React.useState("ALL")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [publishingId, setPublishingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/courses?limit=100")
      .then((res) => {
        if (!res.ok) throw new Error("Failed")
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          const allCourses = Array.isArray(data) ? data : data.courses || []
          setCourses(allCourses.filter((c: PendingCourse) => !c.isPublished))
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load pending courses")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handlePublish(course: PendingCourse) {
    setPublishingId(course.id)
    try {
      const result = await apiPatch(`/courses/${course.id}`, {
        isPublished: true,
      })
      if (!result.error) {
        setCourses((prev) => prev.filter((c) => c.id !== course.id))
        toast.success(`${course.title} has been published`)
      } else {
        toast.error(result.error || "Failed to publish course")
      }
    } catch {
      toast.error("Failed to publish course")
    } finally {
      setPublishingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const result = await apiDelete(`/courses/${deleteId}`)
      if (!result.error) {
        setCourses((prev) => prev.filter((c) => c.id !== deleteId))
        toast.success("Course deleted")
      } else {
        toast.error(result.error || "Failed to delete course")
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
    return matchesSearch && matchesLevel
  })

  function getLevelVariant(level: string) {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      BEGINNER: "default",
      INTERMEDIATE: "secondary",
      ADVANCED: "outline",
    }
    return variants[level] || "outline"
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading pending courses...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Courses</h1>
        <p className="mt-1 text-muted-foreground">
          Review and publish courses submitted by instructors
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pending courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="BEGINNER">Beginner</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
            <SelectItem value="ADVANCED">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="text-success mb-4 size-12" />
            <p className="text-lg font-medium">No pending courses</p>
            <p className="text-sm text-muted-foreground">
              {search || levelFilter !== "ALL"
                ? "Try adjusting your search or filters"
                : "All courses have been reviewed and published"}
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
                  <TableHead>Instructor</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                          <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="size-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {course.instructor?.fullName ?? "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelVariant(course.level)}>
                        {course.level}
                      </Badge>
                    </TableCell>
                    <TableCell>{course._count?.modules ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(course.createdAt).toLocaleDateString()}
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
                          onClick={() => handlePublish(course)}
                          disabled={publishingId === course.id}
                        >
                          {publishingId === course.id ? (
                            <Loader2 className="text-success h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="text-success h-3.5 w-3.5" />
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
