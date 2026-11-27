"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  CircleAlert,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { CourseCard } from "@/features/courses/course-card"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { apiGet } from "@/lib/api-client"
import type { KPICard, Enrollment, Course, Assignment } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLoading } from "@/components/loading-skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

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
    <Card className={cn("gap-0", accent && "bg-primary/5 ring-primary/20")}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-4 py-4">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </CardTitle>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
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
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
      </CardContent>
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
    <div className="flex items-start gap-3 px-1 py-3 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
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
              "text-xs font-medium",
              isUrgent ? "text-primary" : "text-muted-foreground"
            )}
          >
            Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"}
          </span>
        </div>
      </div>
      <Button asChild variant="link" size="sm" className="shrink-0">
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

  if (isLoading) return <DashboardLoading />

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-8">
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <PageHeader
          title={`Welcome back, ${user?.fullName?.split(" ")[0] ?? ""}`}
          description="Continue your learning journey"
        />

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
            accent={
              Number(String(kpis[2]?.value ?? "0").replace("%", "")) >= 50
            }
          />
          <StatCard
            label="Upcoming Deadlines"
            value={String(kpis[3]?.value || "0")}
            icon={Clock}
            accent={Number(kpis[3]?.value ?? 0) > 0}
          />
        </div>

        {/* Main content grid */}
        <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column - Continue Learning */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Continue Learning
              </h2>
              <Button asChild variant="link" size="sm">
                <Link href="/student/my-learning/enrolled">
                  View all <ChevronRight data-icon="inline-end" />
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
              <Empty className="rounded-lg border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpen />
                  </EmptyMedia>
                  <EmptyTitle>No courses yet</EmptyTitle>
                  <EmptyDescription>
                    Start your learning journey
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild>
                    <Link href="/student/courses/catalogue">
                      Browse Courses <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </div>

          {/* Right column - Deadlines + Recommended */}
          <div className="flex min-w-0 flex-col gap-7">
            {/* Upcoming Deadlines */}
            <div className="min-w-0">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Upcoming Deadlines
              </h2>
              {upcomingDeadlines.length > 0 ? (
                <Card className="px-4">
                  <CardContent className="flex flex-col p-0">
                    {upcomingDeadlines.map((d, i) => (
                      <React.Fragment key={i}>
                        {i > 0 ? <Separator /> : null}
                        <DeadlineItem
                          title={d.title}
                          courseTitle={d.courseTitle}
                          daysUntilDue={d.daysUntilDue}
                        />
                      </React.Fragment>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Empty className="rounded-lg border border-dashed">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Calendar />
                    </EmptyMedia>
                    <EmptyTitle>No upcoming deadlines</EmptyTitle>
                    <EmptyDescription>
                      You&apos;re all caught up!
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>

            {/* Recommended */}
            <div className="min-w-0">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
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
