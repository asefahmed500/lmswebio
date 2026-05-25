/**
 * Continue learning page for students
 * Shows courses in progress sorted by last accessed, prioritising unfinished courses
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Play, ArrowRight } from "lucide-react"
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
    id: c.id as unknown as number,
    title: c.title,
    slug: c.slug,
    description: c.description ?? undefined,
    thumbnail: c.thumbnail ?? undefined,
    level: c.level as Course["level"],
    isPublished: c.isPublished,
    instructorId: c.instructorId as unknown as number,
    instructor: c.instructor
      ? {
          id: c.instructor.id as unknown as number,
          email: "",
          fullName: c.instructor.fullName,
          role: "INSTRUCTOR" as const,
          createdAt: "",
        }
      : undefined,
    modules: c.modules.map((m) => ({
      id: m.id as unknown as number,
      title: "",
      order: 0,
      courseId: c.id as unknown as number,
      lessons: Array.from({ length: m.lessonCount }, (_, i) => ({
        id: i,
        title: "",
        contentType: "text" as const,
        order: i,
        moduleId: m.id as unknown as number,
      })),
    })),
    category: c.category ?? undefined,
    tags: c.tags,
    createdAt: c.createdAt,
  }
  return {
    id: api.id as unknown as number,
    userId: api.userId as unknown as number,
    courseId: api.courseId as unknown as number,
    status: api.status as Enrollment["status"],
    progress: api.progress,
    lastAccessedAt: api.lastAccessedAt ?? undefined,
    completedAt: api.completedAt ?? undefined,
    enrolledAt: api.enrolledAt,
    course,
  }
}

function InProgressCard({ enrollment }: { enrollment: Enrollment }) {
  if (!enrollment.course) return null

  const { course } = enrollment

  return (
    <Card className="overflow-hidden">
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
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge className="absolute top-2 right-2" variant="secondary">
          {course.level}
        </Badge>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1 text-base">{course.title}</CardTitle>
        {course.instructor && (
          <CardDescription>
            by {course.instructor.fullName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
              {course.modules.length} modules
            </span>
            <span>
              {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
            </span>
          </div>
          <Button className="w-full" asChild>
            <Link href={`/student/courses/${course.id}`}>
              <Play className="mr-2 h-4 w-4" />
              Continue
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContinueLearningPage() {
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
        const mapped = data.map(mapEnrollment)
        setEnrollments(mapped)
      } catch (error) {
        console.error("Failed to load enrollments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  const inProgressCourses = React.useMemo(() => {
    return enrollments
      .filter((e) => e.progress > 0 && e.progress < 100)
      .sort((a, b) => {
        const dateA = a.lastAccessedAt
          ? new Date(a.lastAccessedAt).getTime()
          : 0
        const dateB = b.lastAccessedAt
          ? new Date(b.lastAccessedAt).getTime()
          : 0
        return dateB - dateA
      })
  }, [enrollments])

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Continue Learning</h1>
        <p className="mt-1 text-muted-foreground">
          Pick up where you left off
        </p>
      </div>

      {inProgressCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {inProgressCourses.map((enrollment) => (
            <InProgressCard
              key={enrollment.id}
              enrollment={enrollment}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Start a new course!</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                You have no courses in progress. Browse the catalogue and begin learning.
              </p>
              <Button asChild>
                <Link href="/student/courses/catalogue">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
