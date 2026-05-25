/**
 * Student dashboard page
 * Displays enrolled courses, progress, upcoming deadlines, and recommendations
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Clock,
  TrendingUp,
  Play,
  Calendar,
  Award,
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
import { apiGet } from "@/lib/api-client"
import type { KPICard, Enrollment, Course, Assignment } from "@/types"

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
  moduleCount: number
  modules: { id: string; lessonCount: number }[]
  createdAt: string
}

function mapApiCoursesToMock(apiCourses: ApiCourse[]): Course[] {
  return apiCourses.map((c) => ({
    id: c.id as unknown as number,
    title: c.title,
    slug: c.slug,
    description: c.description ?? undefined,
    thumbnail: c.thumbnail ?? undefined,
    level: c.level as Course["level"],
    isPublished: c.isPublished,
    instructorId: c.instructorId as unknown as number,
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
  }))
}

/**
 * KPI card component
 */
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
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
      </CardContent>
    </Card>
  )
}

/**
 * Enrolled course card component
 */
function EnrolledCourseCard({ enrollment }: { enrollment: Enrollment }) {
  if (!enrollment.course) return null

  const { course } = enrollment
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  )
  const completedLessons = Math.round(
    (enrollment.progress / 100) * totalLessons
  )

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
        <CardDescription className="line-clamp-2">
          {course.description}
        </CardDescription>
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
              Continue Learning
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Upcoming deadline item component
 */
function UpcomingDeadlineItem({
  title,
  courseTitle,
  dueDate,
}: {
  title: string
  courseTitle: string
  dueDate: string
}) {
  const daysUntilDue = React.useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const diff = new Date(dueDate).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [dueDate])

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <div className="mt-0.5 rounded-full bg-destructive/10 p-2">
        <Clock className="h-4 w-4 text-destructive" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-none font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{courseTitle}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <Calendar className="h-3 w-3" />
          Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"}
        </p>
      </div>
      <Button size="sm" variant="ghost" asChild>
        <Link href="/student/assignments/pending">View</Link>
      </Button>
    </div>
  )
}

/**
 * Recommended course card component
 */
function RecommendedCourseCard({ course }: { course: Course }) {
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
        <CardDescription className="line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>{course.modules.length} modules</span>
            <span>•</span>
            <span>
              {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)}{" "}
              lessons
            </span>
          </div>
          <Button className="w-full" variant="outline" asChild>
            <Link href="/student/courses/catalogue">View Course</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Student dashboard page component
 */
interface DeadlineItem {
  title: string
  courseTitle: string
  dueDate: string
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

  // Load dashboard data
  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch all data in parallel
        const [enrollmentsRes, coursesRes, progressRes, assignmentsRes] =
          await Promise.all([
            fetch("/api/enrollments"),
            fetch("/api/courses"),
            fetch("/api/progress"),
            fetch("/api/assignments"),
          ])

        // Parse responses
        const enrollmentsData = enrollmentsRes.ok
          ? await enrollmentsRes.json()
          : { enrollments: [] }
        const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] }
        const progressData = progressRes.ok ? await progressRes.json() : {}
        const assignmentsData = assignmentsRes.ok
          ? await assignmentsRes.json()
          : { assignments: [] }

        // Filter enrollments for this student
        const studentEnrollments = enrollmentsData.enrollments?.filter(
          (e: Enrollment) => e.userId === user.id && e.status === "ACTIVE"
        ) || []

        // Build KPIs
        const completedCourses = studentEnrollments.filter(
          (e: Enrollment) => e.progress === 100
        ).length
        const avgProgress =
          studentEnrollments.length > 0
            ? Math.round(
                studentEnrollments.reduce(
                  (sum: number, e: Enrollment) => sum + e.progress,
                  0
                ) / studentEnrollments.length
              )
            : 0

        // Count upcoming deadlines
        const now = new Date()
        const upcomingDeadlinesCount = assignmentsData.assignments?.filter(
          (a: Assignment) => {
            const enrolledCourseIds = studentEnrollments.map(
              (e: Enrollment) => e.courseId
            )
            return (
              a.dueDate &&
              new Date(a.dueDate) > now &&
              enrolledCourseIds.includes(a.courseId)
            )
          }
        ).length || 0

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
            value: `${avgProgress}%`,
          },
          {
            label: "Upcoming Deadlines",
            value: upcomingDeadlinesCount.toString(),
          },
        ]

        // Enrich enrollments with course data
        const enrichedEnrollments = studentEnrollments
          .map((enrollment: Enrollment) => {
            const course = coursesData.courses?.find(
              (c: Course) => c.id === enrollment.courseId
            )
            return { ...enrollment, course }
          })
          .sort((a: Enrollment, b: Enrollment) => {
            const dateA = a.lastAccessedAt
              ? new Date(a.lastAccessedAt).getTime()
              : 0
            const dateB = b.lastAccessedAt
              ? new Date(b.lastAccessedAt).getTime()
              : 0
            return dateB - dateA
          })

        // Get recommended courses (not enrolled)
        const enrolledCourseIds = studentEnrollments.map(
          (e: Enrollment) => e.courseId
        )
        const apiCourses = coursesData.courses || []
        const allCourses = mapApiCoursesToMock(apiCourses)
        const recommended = allCourses.filter(
          (c) => !enrolledCourseIds.includes(c.id)
        )

        // Build upcoming deadlines
        const deadlines = assignmentsData.assignments
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
              dueDate: a.dueDate!,
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
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.fullName?.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Continue your learning journey and track your progress.
        </p>
      </div>

      {/* KPI cards grid */}
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

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue learning */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Continue Learning</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/courses/enrolled">View All</Link>
            </Button>
          </div>
          {enrollments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.slice(0, 4).map((enrollment) => (
                <EnrolledCourseCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming deadlines */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Upcoming Deadlines</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((d, i) => (
                      <UpcomingDeadlineItem
                        key={i}
                        title={d.title}
                        courseTitle={d.courseTitle}
                        dueDate={d.dueDate}
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

          {/* Recommended courses */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Recommended for You</h2>
            <div className="space-y-4">
              {recommendedCourses.slice(0, 2).map((course) => (
                <RecommendedCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
