"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Edit, Eye, Trash2, Plus, CircleAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CourseGridLoading } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
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
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPatch, apiDelete } from "@/lib/api-client"

interface DraftCourse {
  id: string
  title: string
  description: string | null
  level: string
  thumbnail: string | null
  isPublished: boolean
  category: string | null
  _count?: { modules: number; enrolments: number }
  updatedAt: string
}

interface DraftCoursesApiResponse {
  courses?: DraftCourse[]
}

export default function InstructorDraftsPage() {
  const { user } = useAuth()
  const [drafts, setDrafts] = React.useState<DraftCourse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadDrafts() {
      if (!user) return
      setIsLoading(true)
      try {
        const result = await apiGet<DraftCoursesApiResponse | DraftCourse[]>(
          "/courses?isPublished=false"
        )
        if (result.error) throw new Error(result.error)
        const data = result.data
        const list = Array.isArray(data)
          ? data
          : (data as DraftCoursesApiResponse).courses || []
        setDrafts(list)
      } catch (error) {
        console.error("Failed to load drafts:", error)
        setError("Failed to load drafts. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    loadDrafts()
  }, [user])

  const handlePublish = async (id: string) => {
    try {
      const res = await apiPatch(`/courses/${id}`, { isPublished: true })
      if (res.error) throw new Error("Failed to publish course")
      setDrafts((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error("Failed to publish course:", error)
      setError("Failed to publish course. Please try again.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await apiDelete(`/courses/${id}`)
      if (res.error) throw new Error("Failed to delete course")
      setDrafts((prev) => prev.filter((c) => c.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error("Failed to delete course:", error)
      setError("Failed to delete course. Please try again.")
    }
  }

  const header = (
    <PageHeader
      title="Drafts"
      description="Unpublished courses ready to be finished and published"
      action={
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus data-icon="inline-start" />
            New Course
          </Link>
        </Button>
      }
    />
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {header}
        <CourseGridLoading count={3} />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {header}

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {drafts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((course) => {
            const moduleCount = course._count?.modules || 0
            return (
              <Card key={course.id} className="overflow-hidden">
                <div className="flex aspect-video w-full items-center justify-center bg-muted">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="size-12 text-muted-foreground" />
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">
                      {course.title}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      Draft
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{course.level}</span>
                      <span>
                        {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last updated{" "}
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="min-w-0 flex-1"
                        onClick={() => handlePublish(course.id)}
                      >
                        <Eye data-icon="inline-start" />
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/instructor/courses/${course.id}/edit`}>
                          <Edit data-icon="inline-start" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        aria-label="Delete draft"
                        onClick={() => setDeleteId(course.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>No drafts</EmptyTitle>
            <EmptyDescription>
              You don&apos;t have any draft courses. Start creating a new course
              or publish your existing drafts from the courses page.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/instructor/courses/new">
                <Plus data-icon="inline-start" />
                Create Course
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be
              undone. All modules, lessons, and associated data will be
              permanently removed.
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
