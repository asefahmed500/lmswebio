"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Play,
  TrendingUp,
  CheckCircle,
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
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth-provider"
import type { Enrollment, Course } from "@/types"

interface ApiEnrollment {
  id: string
  userId: string
  courseId: string
  status: string
  progress: number
  lastAccessedAt: string | null
  completedAt: string | null
  enrolledAt: string
  course: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnail: string | null
    level: string
    isPublished: boolean
    instructorId: string
    instructor: { id: string; fullName: string } | null
    category: string | null
    tags: string[]
    modules: { id: string; lessonCount: number }[]
    createdAt: string
  }
}

function mapEnrollment(api: ApiEnrollment): Enrollment {
  const c = api.course
  const course: Course = {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description ?? undefined,
    thumbnail: c.thumbnail ?? undefined,
    level: c.level as Course["level"],
    isPublished: c.isPublished,
    instructorId: c.instructorId,
    instructor: c.instructor
      ? {
          id: c.instructor.id,
          email: "",
          fullName: c.instructor.fullName,
          role: "INSTRUCTOR" as const,
          createdAt: "",
        }
      : undefined,
    modules: c.modules.map((m) => ({
      id: m.id,
      title: "",
      order: 0,
      courseId: c.id,
      lessons: Array.from({ length: m.lessonCount }, (_, i) => ({
        id: String(i),
        title: "",
        contentType: "text" as const,
        order: i,
        moduleId: m.id,
      })),
    })),
    category: c.category ?? undefined,
    tags: c.tags,
    createdAt: c.createdAt,
  }
  return {
    id: api.id,
    userId: api.userId,
    courseId: api.courseId,
    status: api.status as Enrollment["status"],
    progress: api.progress,
    lastAccessedAt: api.lastAccessedAt ?? undefined,
    completedAt: api.completedAt ?? undefined,
    enrolledAt: api.enrolledAt,
    course,
  }
}

export default function ProgressPage() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await fetch("/api/enrolments/my")
        if (!res.ok) throw new Error("Failed to fetch enrollments")
        const data: ApiEnrollment[] = await res.json()
        setEnrollments(data.map(mapEnrollment))
      } catch (error) {
        console.error("Failed to load progress data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user])

  const stats = React.useMemo(() => {
    const total = enrollments.length
    const completed = enrollments.filter((e) => e.progress >= 100).length
    const inProgress = enrollments.filter(
      (e) => e.progress > 0 && e.progress < 100
    ).length
    const notStarted = enrollments.filter((e) => e.progress === 0).length
    const avgProgress =
      total > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + e.progress, 0) / total
          )
        : 0
    const totalLessons = enrollments.reduce(
      (sum, e) =>
        sum +
        (e.course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0),
      0
    )
    const completedLessons = Math.round((avgProgress / 100) * totalLessons)
    return {
      total,
      completed,
      inProgress,
      notStarted,
      avgProgress,
      totalLessons,
      completedLessons,
    }
  }, [enrollments])

  const sortedEnrollments = React.useMemo(() => {
    return [...enrollments].sort((a, b) => b.progress - a.progress)
  }, [enrollments])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading progress data...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/achievements">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Learning Progress
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your progress across all enrolled courses
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enrolled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-info size-5" />
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-success size-5" />
              <div className="text-2xl font-bold">{stats.completed}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-warning size-5" />
              <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Completion</CardTitle>
          <CardDescription>
            {stats.completed} of {stats.total} courses completed &middot;{" "}
            {stats.completedLessons} of {stats.totalLessons} lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
            className="h-3"
          />
        </CardContent>
      </Card>

      {sortedEnrollments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedEnrollments.map((enrollment) => {
            if (!enrollment.course) return null
            const { course } = enrollment
            const isCompleted = enrollment.progress >= 100
            const totalLessons = course.modules.reduce(
              (sum, m) => sum + m.lessons.length,
              0
            )
            const completedLessons = Math.round(
              (enrollment.progress / 100) * totalLessons
            )

            return (
              <Card key={enrollment.id} className="overflow-hidden">
                <div className="relative aspect-video w-full bg-muted">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="size-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {course.level}
                  </Badge>
                  {isCompleted && (
                    <Badge className="bg-success hover:bg-success/90 absolute top-2 left-2 gap-1">
                      <CheckCircle className="size-3" />
                      Completed
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1 text-base">
                    {course.title}
                  </CardTitle>
                  {course.instructor && (
                    <CardDescription>
                      by {course.instructor.fullName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {enrollment.progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {completedLessons} of {totalLessons} lessons
                      </span>
                      <span>{course.modules.length} modules</span>
                    </div>
                    <Button className="w-full" asChild>
                      <Link href={`/student/courses/${course.id}`}>
                        <Play data-icon="inline-start" />
                        {isCompleted ? "Review Course" : "Continue Learning"}
                      </Link>
                    </Button>
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
              <h3 className="mb-2 text-lg font-semibold">
                No courses enrolled
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Enroll in a course to start tracking your learning progress.
              </p>
              <Button asChild>
                <Link href="/student/courses/catalogue">Browse Courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
