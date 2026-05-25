/**
 * Instructor dashboard page
 * Displays instructor's courses, student progress, and grading queue
 */

"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Clock,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import type {
  KPICard,
  CoursePerformance,
  Course,
  Assignment,
  AssignmentSubmission,
} from "@/types"

/**
 * KPI card component
 */
function KPICardComponent({ kpi }: { kpi: KPICard }) {
  const isPositive = kpi.trend === "up"
  const isNegative = kpi.trend === "down"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {kpi.label}
        </CardTitle>
        <div className="rounded-full bg-primary/10 p-2">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        {kpi.change !== undefined && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {isPositive && <ArrowUpRight className="h-3 w-3 text-green-500" />}
            {isNegative && <ArrowUpRight className="h-3 w-3 text-red-500" />}
            <span
              className={
                isPositive ? "text-green-500" : isNegative ? "text-red-500" : ""
              }
            >
              {kpi.change > 0 ? "+" : ""}
              {kpi.change}%
            </span>
            <span>from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Course performance card component
 */
function CoursePerformanceCard({ course }: { course: CoursePerformance }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{course.courseName}</CardTitle>
            <CardDescription>
              {course.totalStudents} students enrolled
            </CardDescription>
          </div>
          <Badge variant="outline">{course.completionRate}% complete</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg Progress</span>
              <span className="font-medium">{course.averageProgress}%</span>
            </div>
            <Progress value={course.averageProgress} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className="font-medium">{course.completionRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Pending grading item component
 */
function PendingGradingItem({
  studentName,
  assignmentTitle,
}: {
  studentName: string
  assignmentTitle: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback>
          {studentName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-none font-medium">
          {studentName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {assignmentTitle}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/instructor/assignments/grading">Grade</Link>
        </Button>
      </div>
    </div>
  )
}

/**
 * Instructor dashboard page component
 */
interface PendingSubmissionItem {
  studentName: string
  assignmentTitle: string
}

export default function InstructorDashboardPage() {
  const { user } = useAuth()
  const [kpis, setKpis] = React.useState<KPICard[]>([])
  const [coursePerformance, setCoursePerformance] = React.useState<
    CoursePerformance[]
  >([])
  const [pendingCount, setPendingCount] = React.useState<number>(0)
  const [pendingSubmissions, setPendingSubmissions] = React.useState<
    PendingSubmissionItem[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Load dashboard data
  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch all data in parallel
        const [coursesRes, analyticsRes, submissionsRes] = await Promise.all([
          fetch("/api/courses"),
          fetch(`/api/analytics?type=user&userId=${user.id}`),
          fetch("/api/submissions"),
        ])

        // Parse responses
        const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] }
        const analyticsData = analyticsRes.ok ? await analyticsRes.json() : {}
        const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] }

        // Filter courses by instructor
        const instructorCourses = coursesData.courses?.filter(
          (c: Course) => c.instructorId === user.id
        ) || []

        // Build KPIs from data
        const totalStudents = instructorCourses.reduce(
          (sum: number, c: any) => sum + (c._count?.enrolments || 0),
          0
        )
        const avgCompletion = instructorCourses.length > 0
          ? Math.round(
              instructorCourses.reduce(
                (sum: number, c: any) =>
                  sum + (c.avgCompletion || 0),
                0
              ) / instructorCourses.length
            )
          : 0

        const kpiData: KPICard[] = [
          {
            label: "My Courses",
            value: instructorCourses.length.toString(),
            change: 5,
            trend: "up",
          },
          {
            label: "Total Students",
            value: totalStudents.toString(),
            change: 12,
            trend: "up",
          },
          {
            label: "Avg Completion",
            value: `${avgCompletion}%`,
            change: 8,
            trend: "up",
          },
          {
            label: "Pending Grading",
            value: submissionsData.submissions?.filter(
              (s: AssignmentSubmission) => !s.grade
            ).length.toString() || "0",
            change: 0,
          },
        ]

        // Build course performance data
        const coursePerformanceData: CoursePerformance[] = instructorCourses.map(
          (c: any) => ({
            courseId: c.id,
            courseName: c.title,
            totalStudents: c._count?.enrolments || 0,
            averageProgress: c.avgCompletion || 0,
            completionRate: Math.round(c.avgCompletion || 0),
          })
        )

        // Build pending submissions
        const pendingSubmissionsData = submissionsData.submissions
          ?.filter((s: AssignmentSubmission) => !s.grade)
          .slice(0, 3)
          .map((s: AssignmentSubmission) => ({
            studentName: s.user?.fullName || "Student",
            assignmentTitle: s.assignment?.title || "Assignment",
          })) || []

        const pendingCount = submissionsData.submissions?.filter(
          (s: AssignmentSubmission) => !s.grade
        ).length || 0

        setKpis(kpiData)
        setCoursePerformance(coursePerformanceData)
        setPendingCount(pendingCount)
        setPendingSubmissions(pendingSubmissionsData)
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
          Instructor Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your courses.
        </p>
      </div>

      {/* KPI cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICardComponent key={index} kpi={kpi} />
        ))}
      </div>

      {/* Course performance and grading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Course performance cards */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Performance</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/instructor/analytics">View Details</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {coursePerformance.slice(0, 4).map((course) => (
              <CoursePerformanceCard key={course.courseId} course={course} />
            ))}
          </div>
        </div>

        {/* Pending grading */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Grading</h2>
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {pendingSubmissions.length > 0 ? (
                  pendingSubmissions.map((sub, i) => (
                    <PendingGradingItem
                      key={i}
                      studentName={sub.studentName}
                      assignmentTitle={sub.assignmentTitle}
                    />
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No pending submissions
                  </p>
                )}
              </div>
              {pendingCount > 3 && (
                <div className="mt-4 border-t pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/instructor/assignments/grading">
                      View all {pendingCount} pending
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/instructor/courses/new">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/instructor/quizzes/new">
                <FileText className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/instructor/assignments/new">
                <CheckCircle className="mr-2 h-4 w-4" />
                Create Assignment
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
