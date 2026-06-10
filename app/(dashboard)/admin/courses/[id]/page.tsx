"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { sanitizeHtml } from "@/lib/sanitize"
import {
  BookOpen,
  Users,
  Layers,
  FileText,
  ArrowLeft,
  Trash2,
  Clock,
  DollarSign,
  Loader2,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client"

interface ApiCourse {
  id: number
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: string
  price: number | null
  isPublished: boolean
  category: string | null
  tags: string[]
  instructor?: { id: number; fullName: string; email: string }
  modules: Array<{
    id: number
    title: string
    order: number
    lessons: Array<{
      id: number
      title: string
      contentType: string
      duration: number | null
      order: number
    }>
  }>
  _count?: { enrolments: number }
  createdAt: string
}

export default function AdminCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [course, setCourse] = React.useState<ApiCourse | null>(null)
  const [studentCount, setStudentCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const courseId = params.id as string

  React.useEffect(() => {
    async function loadData() {
      if (!courseId || !user) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiGet<Record<string, unknown>>(
          `/courses/${courseId}`
        )
        if (res.error || !res.data) throw new Error("Course not found")
        const raw = res.data
        const courseData = (raw.course || raw) as ApiCourse
        setCourse(courseData)

        try {
          const enrolRes = await apiGet<unknown[]>(
            `/enrollments?courseId=${courseId}`
          )
          if (!enrolRes.error && enrolRes.data) {
            const data = enrolRes.data
            setStudentCount(
              Array.isArray(data)
                ? data.length
                : Array.isArray((data as Record<string, unknown>)?.enrollments)
                  ? ((data as Record<string, unknown>).enrollments as unknown[])
                      .length
                  : 0
            )
          }
        } catch {
          setStudentCount(0)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [courseId, user])

  const handleTogglePublish = async () => {
    if (!course) return
    try {
      const res = await apiPatch(`/courses/${course.id}`, {
        isPublished: !course.isPublished,
      })
      if (!res.error) {
        setCourse({ ...course, isPublished: !course.isPublished })
        toast.success(
          course.isPublished ? "Course unpublished" : "Course published"
        )
      }
    } catch {
      toast.error("Failed to update course")
    }
  }

  const handleDelete = async () => {
    if (!course) return
    try {
      const res = await apiDelete(`/courses/${course.id}`)
      if (!res.error) {
        toast.success("Course deleted")
        router.push("/admin/courses")
      } else {
        toast.error("Failed to delete course")
      }
    } catch {
      toast.error("Failed to delete course")
    }
    setShowDeleteDialog(false)
  }

  const totalLessons = React.useMemo(
    () =>
      course ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0) : 0,
    [course]
  )

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Course not found</h3>
          <Button asChild>
            <Link href="/admin/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/courses">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="mt-1 text-muted-foreground">Course management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <Eye data-icon="inline-start" />
              Edit Content
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 h-auto p-2"
              onClick={handleTogglePublish}
            >
              {course.isPublished ? (
                <ToggleRight className="text-success mr-1 size-5" />
              ) : (
                <ToggleLeft className="mr-1 size-5 text-muted-foreground" />
              )}
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {course.level.toLowerCase()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Price
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {course.price != null && course.price > 0
                ? `$${course.price.toFixed(2)}`
                : "Free"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Content
            </CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {course.modules.length}m / {totalLessons}l
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">
            {course.instructor?.fullName ?? "Unknown"}
          </p>
          <p className="text-sm text-muted-foreground">
            {course.instructor?.email}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          {course.description ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(course.description),
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No description provided.
            </p>
          )}
        </CardContent>
      </Card>

      {course.category && (
        <Card>
          <CardHeader>
            <CardTitle>Category & Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Category:
              </span>
              <Badge variant="outline">{course.category}</Badge>
            </div>
            {course.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Tags:
                </span>
                <div className="flex flex-wrap gap-1">
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Course Modules ({course.modules.length})</CardTitle>
          <CardDescription>{totalLessons} total lessons</CardDescription>
        </CardHeader>
        <CardContent>
          {course.modules.length > 0 ? (
            <div className="flex flex-col gap-3">
              {course.modules
                .sort((a, b) => a.order - b.order)
                .map((mod, i) => (
                  <Card key={mod.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {i + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {mod.title}
                          </CardTitle>
                          <CardDescription>
                            {mod.lessons.length} lessons
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1">
                        {mod.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 rounded-lg bg-muted/50 p-2 text-sm"
                            >
                              <FileText className="size-4 text-muted-foreground" />
                              <span className="flex-1">{lesson.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {lesson.contentType}
                              </Badge>
                              {lesson.duration && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="size-3" />
                                  {lesson.duration}m
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No modules yet.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{course.title}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
