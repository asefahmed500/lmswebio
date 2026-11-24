"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { CourseCard } from "@/features/courses/course-card"
import { apiGet } from "@/lib/api-client"
import type { KPICard, Enrollment, Course, Assignment } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { cn } from "@/lib/utils"

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

interface StatCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent?: boolean
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className={cn("p-5", accent && "bg-primary/5 ring-primary/20")}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-heading text-[32px] leading-none font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accent ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "size-4",
              accent ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
      </div>
    </Card>
  )
}

function DeadlineItem({
  title,
  courseTitle,
  daysUntilDue,
}: {
  title: string
  courseTitle: string
  daysUntilDue: number
}) {
  const isUrgent = daysUntilDue <= 2
  return (
    <div className="flex items-start gap-3 border-b border-border px-1 py-3.5 transition-colors last:border-b-0 hover:bg-muted/50">
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
          isUrgent ? "bg-primary/10" : "bg-muted"
        )}
      >
        <Clock
          className={cn(
            "size-3.5",
            isUrgent ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{courseTitle}</p>
        <div className="mt-1 flex items-center gap-1">
          <Calendar
            className={cn(
              "size-3",
              isUrgent ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[11px] font-medium",
              isUrgent ? "text-primary" : "text-muted-foreground"
            )}
          >
            Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"}
          </span>
        </div>
      </div>
      <Button
        asChild
        variant="link"
        size="sm"
        className="mt-0.5 h-auto shrink-0 p-0"
      >
        <Link href="/student/assignments/pending">View</Link>
      </Button>
    </div>
  )
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [error, setError] = React.useState<string | null>(null)
  const [kpis, setKpis] = React.useState<KPICard[]>([])
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [recommendedCourses, setRecommendedCourses] = React.useState<Course[]>(
    []
  )
  const [upcomingDeadlines, setUpcomingDeadlines] = React.useState<
    { title: string; courseTitle: string; daysUntilDue: number }[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        const [enrollmentsRes, coursesRes, progressRes, assignmentsRes] =
          await Promise.all([
            apiGet<Enrollment[]>("/enrolments/my"),
            apiGet("/courses"),
            apiGet("/progress"),
            apiGet("/assignments"),
          ])

        const enrollmentList: Enrollment[] =
          (enrollmentsRes.data as Enrollment[]) ?? []
        const coursesData: CoursesApiResponse =
          (coursesRes.data as CoursesApiResponse) ?? { courses: [] }
        const progressData: ProgressApiResponse =
          (progressRes.data as ProgressApiResponse) ?? {}
        const assignmentsData: AssignmentsApiResponse =
          (assignmentsRes.data as AssignmentsApiResponse) ?? { assignments: [] }

        const studentEnrollments =
          enrollmentList.filter(
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
          { label: "Completed Courses", value: completedCourses.toString() },
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
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <div className="flex min-w-0 flex-col gap-5">
              <Skeleton className="h-7 w-48" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-7">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div>
          <h1 className="font-heading text-[36px] leading-tight font-semibold tracking-tight text-foreground sm:text-[42px]">
            Welcome back, {user?.fullName?.split(" ")[0]}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Continue your learning journey
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Enrolled Courses"
            value={String(kpis[0]?.value || "0")}
            icon={BookOpen}
          />
          <StatCard
            label="Completed Courses"
            value={String(kpis[1]?.value || "0")}
            icon={CheckCircle}
          />
          <StatCard
            label="Avg Progress"
            value={String(kpis[2]?.value || "0%")}
            icon={TrendingUp}
            accent={parseInt(String(kpis[2]?.value || "0")) >= 50}
          />
          <StatCard
            label="Upcoming Deadlines"
            value={String(kpis[3]?.value || "0")}
            icon={Clock}
            accent={parseInt(String(kpis[3]?.value || "0")) > 0}
          />
        </div>

        {/* Main content grid */}
        <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column - Continue Learning */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[22px] font-semibold tracking-tight text-foreground">
                Continue Learning
              </h2>
              <Button asChild variant="link" size="sm" className="h-auto p-0">
                <Link href="/student/my-learning/enrolled">
                  View all <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            {enrollments.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
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
              <Card className="flex flex-col items-center justify-center py-14 text-center">
                <CardContent className="flex flex-col items-center">
                  <BookOpen className="mb-4 size-10 text-muted-foreground/50" />
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    No courses yet
                  </h3>
                  <p className="mt-1.5 mb-5 text-sm text-muted-foreground">
                    Start your learning journey
                  </p>
                  <Button asChild>
                    <Link href="/student/courses/catalogue">
                      Browse Courses <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Deadlines + Recommended */}
          <div className="flex min-w-0 flex-col gap-7">
            {/* Upcoming Deadlines */}
            <div>
              <h2 className="font-heading mb-4 text-[22px] font-semibold tracking-tight text-foreground">
                Upcoming Deadlines
              </h2>
              <Card className="px-4">
                <CardContent className="flex flex-col p-0">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((d, i) => (
                      <DeadlineItem
                        key={i}
                        title={d.title}
                        courseTitle={d.courseTitle}
                        daysUntilDue={d.daysUntilDue}
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No upcoming deadlines
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        You&apos;re all caught up!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommended */}
            <div>
              <h2 className="font-heading mb-4 text-[22px] font-semibold tracking-tight text-foreground">
                Recommended for You
              </h2>
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
    </div>
  )
}
