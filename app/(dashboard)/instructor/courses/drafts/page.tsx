"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Edit, Eye, Trash2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  modules: Array<{
    id: string
    title: string
    lessons: Array<{ id: string }>
  }>
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
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading drafts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drafts</h1>
          <p className="mt-1 text-muted-foreground">
            Unpublished courses ready to be finished and published
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus data-icon="inline-start" />
            New Course
          </Link>
        </Button>
      </div>

      {drafts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((course) => {
            const totalLessons = course.modules.reduce(
              (sum, m) => sum + m.lessons.length,
              0
            )
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
                        {course.modules.length} modules &middot; {totalLessons}{" "}
                        lessons
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last updated{" "}
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePublish(course.id)}
                      >
                        <Eye className="mr-1 size-4" />
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/instructor/courses/${course.id}/edit`}>
                          <Edit className="mr-1 size-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
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
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No drafts</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                You don&apos;t have any draft courses. Start creating a new
                course or publish your existing drafts from the courses page.
              </p>
              <Button asChild>
                <Link href="/instructor/courses/new">
                  <Plus data-icon="inline-start" />
                  Create Course
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
