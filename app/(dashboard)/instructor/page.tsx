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
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import type { KPICard, CoursePerformance } from "@/types"

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
          <TrendingUp className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        {kpi.change !== undefined && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {isPositive && <ArrowUpRight className="text-success size-3" />}
            {isNegative && <ArrowUpRight className="size-3 text-destructive" />}
            <span
              className={
                isPositive
                  ? "text-success"
                  : isNegative
                    ? "text-destructive"
                    : ""
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

function CoursePerformanceCard({ course }: { course: CoursePerformance }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{course.courseName}</CardTitle>
            <CardDescription>
              {course.totalStudents} students enrolled
            </CardDescription>
          </div>
          <Badge variant="outline">{course.completionRate}% complete</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
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
          <Clock className="size-3" />
          Pending
        </Badge>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/instructor/assignments/grading">Grade</Link>
        </Button>
      </div>
    </div>
  )
}

interface RecentSubmission {
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
  }
  assignment: {
    id: string
    title: string
    courseId: string
    course: { id: string; title: string }
  }
  grade: number | null
}

export default function InstructorDashboardPage() {
  const { user } = useAuth()
  const [kpis, setKpis] = React.useState<KPICard[]>([])
  const [coursePerformance, setCoursePerformance] = React.useState<
    CoursePerformance[]
  >([])
  const [pendingCount, setPendingCount] = React.useState<number>(0)
  const [pendingSubmissions, setPendingSubmissions] = React.useState<
    { studentName: string; assignmentTitle: string }[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        const dashResult = await apiGet<{
          totalCourses: number
          totalStudents: number
          totalQuizzes: number
          totalAssignments: number
          recentSubmissions: RecentSubmission[]
        }>("/instructors/dashboard")

        if (dashResult.error || !dashResult.data) {
          console.error("Failed to load dashboard:", dashResult.error)
          return
        }

        const data = dashResult.data

        const kpiData: KPICard[] = [
          {
            label: "My Courses",
            value: String(data.totalCourses),
            trend: "up",
          },
          {
            label: "Total Students",
            value: String(data.totalStudents),
            trend: "up",
          },
          {
            label: "Total Quizzes",
            value: String(data.totalQuizzes),
            trend: "up",
          },
          {
            label: "Pending Grading",
            value: String(
              data.recentSubmissions.filter((s) => s.grade == null).length
            ),
            trend: "up",
          },
        ]

        const pending = data.recentSubmissions
          .filter((s) => s.grade == null)
          .slice(0, 3)
          .map((s) => ({
            studentName: s.user.fullName,
            assignmentTitle: s.assignment.title,
          }))

        setKpis(kpiData)
        setPendingCount(
          data.recentSubmissions.filter((s) => s.grade == null).length
        )
        setPendingSubmissions(pending)
        setCoursePerformance([])
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
          Instructor Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your courses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICardComponent key={index} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
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

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Grading</h2>
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
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
                <>
                  <Separator className="mt-4" />
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/instructor/assignments/grading">
                        View all {pendingCount} pending
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/instructor/courses/new">
                <BookOpen data-icon="inline-start" />
                Create Course
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/instructor/quizzes/new">
                <FileText data-icon="inline-start" />
                Create Quiz
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/instructor/assignments/new">
                <CheckCircle data-icon="inline-start" />
                Create Assignment
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
