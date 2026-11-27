"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Eye, Trash2, CheckCircle2, Search } from "lucide-react"
import { toast } from "sonner"
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
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
    apiGet<{ courses: PendingCourse[] }>("/courses?limit=100")
      .then((result) => {
        if (!cancelled && !result.error && result.data)
          setCourses(result.data.courses.filter((c) => !c.isPublished))
        else if (!cancelled) toast.error("Failed to load pending courses")
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

  if (isLoading) return <PageLoading label="Loading pending courses…" />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pending Courses"
        description="Review and publish courses submitted by instructors"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InputGroup className="h-9 flex-1">
          <InputGroupInput
            placeholder="Search pending courses..."
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
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2 className="text-success" />
                </EmptyMedia>
                <EmptyTitle>No pending courses</EmptyTitle>
                <EmptyDescription>
                  {search || levelFilter !== "ALL"
                    ? "Try adjusting your search or filters"
                    : "All courses have been reviewed and published"}
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
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                          <BookOpen className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{course.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
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
                            <Eye />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handlePublish(course)}
                          disabled={publishingId === course.id}
                          aria-label={`Publish ${course.title}`}
                        >
                          {publishingId === course.id ? (
                            <Spinner className="text-success" />
                          ) : (
                            <CheckCircle2 className="text-success" />
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
