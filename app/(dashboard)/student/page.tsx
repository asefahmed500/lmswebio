"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { CourseCard } from "@/components/course/course-card"
import { apiGet } from "@/lib/api-client"
import type { KPICard, Enrollment, Course, Assignment } from "@/types"

interface EnrollmentsApiResponse {
  enrollments: Enrollment[]
}

interface CoursesApiResponse {
  courses: ApiCourse[]
}

interface ProgressApiResponse {
  overallProgress?: number
}

interface AssignmentsApiResponse {
  assignments: Assignment[]
}

interface ApiCourse {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: string
  isPublished: boolean
  instructorId: string
  instructor?: { id: string; fullName: string; avatarUrl: string | null }
  category: string | null
  tags: string[]
  moduleCount: number
  modules: { id: string; lessonCount: number }[]
  createdAt: string
}

function mapApiCoursesToMock(apiCourses: ApiCourse[]): Course[] {
  return apiCourses.map((c) => ({
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
          fullName: c.instructor.fullName,
          avatarUrl: c.instructor.avatarUrl ?? undefined,
          email: "",
          role: "INSTRUCTOR" as const,
          createdAt: "",
        }
      : undefined,
    modules: (c.modules || []).map((m) => ({
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
  }))
}

function KPICardComponent({
  kpi,
  icon: Icon,
}: {
  kpi: KPICard
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {kpi.label}
        </CardTitle>
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
      </CardContent>
    </Card>
  )
}

function UpcomingDeadlineItem({
  title,
  courseTitle,
  daysUntilDue,
}: {
  title: string
  courseTitle: string
  daysUntilDue: number
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <div className="mt-0.5 rounded-full bg-destructive/10 p-2">
        <Clock className="size-4 text-destructive" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-none font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{courseTitle}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <Calendar className="size-3" />
          Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"}
        </p>
      </div>
      <Button size="sm" variant="ghost" asChild>
        <Link href="/student/assignments/pending">View</Link>
      </Button>
    </div>
  )
}

interface DeadlineItem {
  title: string
  courseTitle: string
  daysUntilDue: number
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [kpis, setKpis] = React.useState<KPICard[]>([])
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [recommendedCourses, setRecommendedCourses] = React.useState<Course[]>(
    []
  )
  const [upcomingDeadlines, setUpcomingDeadlines] = React.useState<
    DeadlineItem[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        const [enrollmentsRes, coursesRes, progressRes, assignmentsRes] =
          await Promise.all([
            apiGet("/enrollments"),
            apiGet("/courses"),
            apiGet("/progress"),
            apiGet("/assignments"),
          ])

        const enrollmentsData: EnrollmentsApiResponse =
          (enrollmentsRes.data as EnrollmentsApiResponse) ?? {
            enrollments: [],
          }
        const coursesData: CoursesApiResponse =
          (coursesRes.data as CoursesApiResponse) ?? {
            courses: [],
          }
        const progressData: ProgressApiResponse =
          (progressRes.data as ProgressApiResponse) ?? {}
        const assignmentsData: AssignmentsApiResponse =
          (assignmentsRes.data as AssignmentsApiResponse) ?? {
            assignments: [],
          }

        const studentEnrollments =
          enrollmentsData.enrollments?.filter(
            (e: Enrollment) => e.userId === user.id && e.status === "ACTIVE"
          ) || []

        const completedCourses = studentEnrollments.filter(
          (e: Enrollment) => e.progress === 100
        ).length
        const now = new Date()
        const upcomingDeadlinesCount =
          assignmentsData.assignments?.filter((a: Assignment) => {
            const enrolledCourseIds = studentEnrollments.map(
              (e: Enrollment) => e.courseId
            )
            return (
              a.dueDate &&
              new Date(a.dueDate) > now &&
              enrolledCourseIds.includes(a.courseId)
            )
          }).length || 0

        const kpiData: KPICard[] = [
          {
            label: "Enrolled Courses",
            value: studentEnrollments.length.toString(),
          },
          {
            label: "Completed Courses",
            value: completedCourses.toString(),
          },
          {
            label: "Avg Progress",
            value: `${Math.round(progressData.overallProgress || 0)}%`,
          },
          {
            label: "Upcoming Deadlines",
            value: upcomingDeadlinesCount.toString(),
          },
        ]

        const enrolledCourseIds = studentEnrollments.map(
          (e: Enrollment) => e.courseId
        )
        const apiCourses = coursesData.courses || []
        const allCourses = mapApiCoursesToMock(apiCourses)

        const enrichedEnrollments = studentEnrollments
          .map((enrollment: Enrollment): Enrollment => {
            const course = allCourses.find((c) => c.id === enrollment.courseId)
            return { ...enrollment, course }
          })
          .sort((a, b) => {
            const dateA = a.lastAccessedAt
              ? new Date(a.lastAccessedAt).getTime()
              : 0
            const dateB = b.lastAccessedAt
              ? new Date(b.lastAccessedAt).getTime()
              : 0
            return dateB - dateA
          })

        const recommended = allCourses.filter(
          (c) => !enrolledCourseIds.includes(c.id)
        )

        const deadlines =
          assignmentsData.assignments
            ?.filter(
              (a: Assignment) =>
                a.dueDate &&
                new Date(a.dueDate) > now &&
                enrolledCourseIds.includes(a.courseId)
            )
            .sort(
              (a: Assignment, b: Assignment) =>
                new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
            )
            .slice(0, 3)
            .map((a: Assignment) => {
              const course = allCourses.find((c) => c.id === a.courseId)
              return {
                title: a.title,
                courseTitle: course?.title || "Course",
                daysUntilDue: Math.ceil(
                  (new Date(a.dueDate!).getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24)
                ),
              }
            }) || []

        setKpis(kpiData)
        setEnrollments(enrichedEnrollments)
        setRecommendedCourses(recommended.slice(0, 3))
        setUpcomingDeadlines(deadlines)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.fullName?.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Continue your learning journey and track your progress.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardComponent
          kpi={kpis[0] || { label: "Enrolled Courses", value: 0 }}
          icon={BookOpen}
        />
        <KPICardComponent
          kpi={kpis[1] || { label: "Completed Courses", value: 0 }}
          icon={CheckCircle}
        />
        <KPICardComponent
          kpi={kpis[2] || { label: "Avg Progress", value: "0%" }}
          icon={TrendingUp}
        />
        <KPICardComponent
          kpi={kpis[3] || { label: "Upcoming Deadlines", value: 0 }}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Continue Learning</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/my-learning/enrolled">View All</Link>
            </Button>
          </div>
          {enrollments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.slice(0, 4).map((enrollment) => {
                if (!enrollment.course) return null
                return (
                  <CourseCard
                    key={enrollment.id}
                    course={{
                      id: enrollment.course.id,
                      title: enrollment.course.title,
                      slug: enrollment.course.slug,
                      description: enrollment.course.description || undefined,
                      thumbnail: enrollment.course.thumbnail || undefined,
                      level: enrollment.course.level,
                      category: enrollment.course.category || undefined,
                      instructor: enrollment.course.instructor
                        ? {
                            id: enrollment.course.instructor.id,
                            fullName: enrollment.course.instructor.fullName,
                            avatarUrl:
                              enrollment.course.instructor.avatarUrl ||
                              undefined,
                          }
                        : { id: "", fullName: "Instructor" },
                      _count: {
                        modules: enrollment.course.modules.length,
                        enrolments: 0,
                      },
                    }}
                    progress={enrollment.progress}
                    enrolled={true}
                    showProgress={true}
                  />
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No courses yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Start your learning journey by enrolling in a course.
                  </p>
                  <Button asChild>
                    <Link href="/student/courses/catalogue">
                      Browse Courses
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Upcoming Deadlines</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((d, i) => (
                      <UpcomingDeadlineItem
                        key={i}
                        title={d.title}
                        courseTitle={d.courseTitle}
                        daysUntilDue={d.daysUntilDue}
                      />
                    ))
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No upcoming deadlines
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Recommended for You</h2>
            <div className="flex flex-col gap-4">
              {recommendedCourses.slice(0, 2).map((course) => (
                <CourseCard
                  key={course.id}
                  course={{
                    id: course.id,
                    title: course.title,
                    slug: course.slug,
                    description: course.description || undefined,
                    thumbnail: course.thumbnail || undefined,
                    level: course.level,
                    category: course.category || undefined,
                    instructor: course.instructor
                      ? {
                          id: course.instructor.id,
                          fullName: course.instructor.fullName,
                          avatarUrl: course.instructor.avatarUrl || undefined,
                        }
                      : { id: "", fullName: "Instructor" },
                    _count: {
                      modules: course.modules.length,
                      enrolments: 0,
                    },
                  }}
                  enrolled={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
