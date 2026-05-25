/**
 * Enrolled courses page for students
 * Displays all courses the student is enrolled in with progress tracking
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Search, Play, CheckCircle } from "lucide-react"
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
import { Input } from "@/components/ui/input"
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

function EnrolledCourseCard({ enrollment }: { enrollment: Enrollment }) {
  if (!enrollment.course) return null

  const { course } = enrollment
  const isCompleted = enrollment.progress >= 100
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  )
  const completedLessons = Math.round((enrollment.progress / 100) * totalLessons)

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
        {isCompleted && (
          <Badge className="absolute top-2 left-2 gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )}
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
              {completedLessons} of {totalLessons} lessons
            </span>
            <span>{course.modules.length} modules</span>
          </div>
          <Button className="w-full" asChild>
            <Link href={`/student/courses/${course.id}`}>
              <Play className="mr-2 h-4 w-4" />
              {isCompleted ? "Review Course" : "Continue Learning"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EnrolledCoursesPage() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

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
        console.error("Failed to load enrollments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  const filteredEnrollments = React.useMemo(() => {
    if (!searchQuery) return enrollments
    const q = searchQuery.toLowerCase()
    return enrollments.filter(
      (e) =>
        e.course?.title.toLowerCase().includes(q) ||
        e.course?.description?.toLowerCase().includes(q)
    )
  }, [enrollments, searchQuery])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading enrolled courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Enrolled Courses</h1>
        <p className="mt-1 text-muted-foreground">
          All courses you have enrolled in
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search enrolled courses..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredEnrollments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEnrollments.map((enrollment) => (
            <EnrolledCourseCard
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
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No matching courses" : "No enrolled courses yet"}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "Browse the catalogue to find courses to enroll in"}
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
