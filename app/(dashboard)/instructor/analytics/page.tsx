/**
 * Instructor analytics page
 * Displays course performance KPIs, student data, and charts
 */

"use client"

import * as React from "react"
import {
  BookOpen,
  Users,
  TrendingUp,
  Eye,
  BarChart3,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/components/auth-provider"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface CourseWithStats {
  id: number
  title: string
  level: string
  isPublished: boolean
  studentCount: number
  avgProgress: number
  completionRate: number
}

function KPICard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function InstructorAnalyticsPage() {
  const { user } = useAuth()
  const [courses, setCourses] = React.useState<CourseWithStats[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        const coursesRes = await fetch("/api/courses")
        if (!coursesRes.ok) throw new Error("Failed to fetch courses")
        const apiCourses = await coursesRes.json()

        const enriched: CourseWithStats[] = await Promise.all(
          apiCourses.map(async (c: { id: string; title: string; level: string; isPublished: boolean; modules: { lessonCount?: number }[] }) => {
            let studentCount = 0
            let avgProgress = 0
            let completionRate = 0

            try {
              const enrolRes = await fetch(`/api/courses/${c.id}/enrolments`)
              if (enrolRes.ok) {
                const enrolments = await enrolRes.json()
                const arr = Array.isArray(enrolments) ? enrolments : []
                studentCount = arr.length
                avgProgress =
                  arr.length > 0
                    ? Math.round(
                        arr.reduce((s: number, e: { progress: number }) => s + e.progress, 0) /
                          arr.length
                      )
                    : 0
                const completed = arr.filter(
                  (e: { status?: string; progress: number }) =>
                    e.status === "COMPLETED" || e.progress >= 100
                ).length
                completionRate =
                  arr.length > 0
                    ? Math.round((completed / arr.length) * 100)
                    : 0
              }
            } catch {
              // enrolment fetch failed, leave defaults
            }

            return {
              id: c.id as unknown as number,
              title: c.title,
              level: c.level,
              isPublished: c.isPublished,
              studentCount,
              avgProgress,
              completionRate,
            }
          })
        )

        setCourses(enriched)
      } catch (error) {
        console.error("Failed to load analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  const totalStudents = React.useMemo(
    () => courses.reduce((sum, c) => sum + c.studentCount, 0),
    [courses]
  )

  const avgCompletion = React.useMemo(
    () =>
      courses.length > 0
        ? Math.round(
            courses.reduce((sum, c) => sum + c.completionRate, 0) /
              courses.length
          )
        : 0,
    [courses]
  )

  const publishedCount = React.useMemo(
    () => courses.filter((c) => c.isPublished).length,
    [courses]
  )

  const chartData = React.useMemo(
    () => ({
      labels: courses.map((c) => c.title),
      datasets: [
        {
          label: "Students Enrolled",
          data: courses.map((c) => c.studentCount),
          backgroundColor: "rgba(59, 130, 246, 0.6)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    }),
    [courses]
  )

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Students per Course",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Course performance and student engagement metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Courses"
          value={courses.length}
          icon={BookOpen}
        />
        <KPICard
          label="Total Students"
          value={totalStudents}
          icon={Users}
        />
        <KPICard
          label="Avg Completion Rate"
          value={`${avgCompletion}%`}
          icon={TrendingUp}
        />
        <KPICard
          label="Published Courses"
          value={publishedCount}
          icon={Eye}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Students per Course</CardTitle>
            <CardDescription>
              Number of enrolled students for each course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <div className="h-72">
                <Bar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                <BarChart3 className="mr-2 h-5 w-5" />
                No course data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>
              Detailed metrics per course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Avg Progress</TableHead>
                    <TableHead>Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.title}
                      </TableCell>
                      <TableCell>{course.studentCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={course.avgProgress} className="h-2 w-16" />
                          <span className="text-sm">{course.avgProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            course.completionRate >= 50 ? "default" : "secondary"
                          }
                        >
                          {course.completionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No courses yet. Create your first course to see metrics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
