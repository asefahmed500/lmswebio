/**
 * Instructor course detail page
 * Displays full course info with modules, lessons, and student enrollment data
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { sanitizeHtml } from "@/lib/sanitize"
import { useParams } from "next/navigation"
import {
  BookOpen,
  Users,
  Layers,
  FileText,
  ArrowLeft,
  Edit,
  Eye,
  Clock,
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
import { useAuth } from "@/components/auth-provider"
import type { Course, Module } from "@/types"

interface ApiCourse {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: string
  isPublished: boolean
  instructorId: string
  category: string | null
  tags: string[]
  modules: ApiModule[]
  _count?: { modules: number; enrolments: number }
  createdAt: string
  updatedAt: string | null
}

interface ApiModule {
  id: string
  title: string
  order: number
  courseId: string
  lessons: ApiLesson[]
}

interface ApiLesson {
  id: string
  title: string
  content: string | null
  contentType: string
  order: number
  moduleId: string
  duration: number | null
}

function mapCourse(api: ApiCourse): Course {
  return {
    id: api.id,
    title: api.title,
    slug: api.slug,
    description: api.description ?? undefined,
    thumbnail: api.thumbnail ?? undefined,
    level: api.level as Course["level"],
    isPublished: api.isPublished,
    instructorId: api.instructorId,
    modules: api.modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      courseId: m.courseId,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content ?? undefined,
        contentType: l.contentType as Module["lessons"][0]["contentType"],
        order: l.order,
        moduleId: l.moduleId,
        duration: l.duration ?? undefined,
      })),
    })),
    category: api.category ?? undefined,
    tags: api.tags,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt ?? undefined,
  }
}

export default function InstructorCourseDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [course, setCourse] = React.useState<Course | null>(null)
  const [studentCount, setStudentCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)

  const courseId = params.id as string

  React.useEffect(() => {
    async function loadData() {
      if (!courseId || !user) return

      setIsLoading(true)
      try {
        const res = await fetch(`/api/courses/${courseId}`)
        if (!res.ok) throw new Error("Failed to fetch course")
        const data: ApiCourse = await res.json()
        setCourse(mapCourse(data))
        setStudentCount(data._count?.enrolments ?? 0)
      } catch (error) {
        console.error("Failed to load course:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [courseId, user])

  const totalLessons = React.useMemo(
    () =>
      course ? course.modules.reduce((sum, m) => sum + m.lessons.length, 0) : 0,
    [course]
  )

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Course not found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            The course you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/instructor/courses">Back to Courses</Link>
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
            <Link href="/instructor/courses">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Course overview and content
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/student/courses/${course.id}`}>
              <Eye data-icon="inline-start" />
              View as Student
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <Edit data-icon="inline-start" />
              Edit Course
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
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
              Students
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="size-4 text-primary" />
            </div>
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
            <div className="rounded-full bg-primary/10 p-2">
              <Layers className="size-4 text-primary" />
            </div>
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
            <CardTitle>Category &amp; Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Category:
              </span>
              <Badge variant="outline">{course.category}</Badge>
            </div>
            {course.tags && course.tags.length > 0 && (
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
          <CardDescription>
            {totalLessons} total lessons across all modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {course.modules.length > 0 ? (
            <div className="flex flex-col gap-3">
              {course.modules
                .sort((a, b) => a.order - b.order)
                .map((module, index) => (
                  <Card key={module.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {module.title}
                            </CardTitle>
                            <CardDescription>
                              {module.lessons.length} lessons
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1">
                        {module.lessons
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
              No modules yet. Use the course editor to add content.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
