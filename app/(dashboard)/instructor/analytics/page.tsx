"use client"

import * as React from "react"
import { BookOpen, Users, TrendingUp, Eye, BarChart3 } from "lucide-react"
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
import { LoadingCard } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface CourseWithStats {
  id: string
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
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
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
        const [analyticsResult, coursesResult] = await Promise.all([
          apiGet<{
            coursePerformance: {
              courseId: string
              courseTitle: string
              enrolled: number
              completed: number
              avgProgress: number
            }[]
            completionRates: {
              courseId: string
              courseTitle: string
              completionRate: number
            }[]
          }>("/instructors/analytics"),
          apiGet<{
            courses: {
              id: string
              level: string
              isPublished: boolean
            }[]
          }>("/courses?limit=100"),
        ])

        if (analyticsResult.error || !analyticsResult.data) {
          console.error("Failed to load analytics:", analyticsResult.error)
          return
        }

        const metadata = new Map(
          (coursesResult.data?.courses ?? []).map((course) => [
            course.id,
            course,
          ])
        )
        const data = analyticsResult.data
        const performance = data.coursePerformance || []
        const rates = data.completionRates || []
        const rateMap = new Map(
          rates.map((r) => [r.courseId, r.completionRate])
        )

        const enriched: CourseWithStats[] = performance.map((p) => ({
          id: p.courseId,
          title: p.courseTitle,
          level: metadata.get(p.courseId)?.level ?? "BEGINNER",
          isPublished: metadata.get(p.courseId)?.isPublished ?? false,
          studentCount: p.enrolled,
          avgProgress: p.avgProgress,
          completionRate: rateMap.get(p.courseId) ?? 0,
        }))

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
          backgroundColor:
            "color-mix(in srgb, var(--chart-1) 60%, transparent)",
          borderColor: "var(--chart-1)",
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

  const header = (
    <PageHeader
      title="Analytics"
      description="Course performance and student engagement metrics"
    />
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {header}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <LoadingCard count={4} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <LoadingCard count={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {header}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Courses" value={courses.length} icon={BookOpen} />
        <KPICard label="Total Students" value={totalStudents} icon={Users} />
        <KPICard
          label="Avg Completion Rate"
          value={`${avgCompletion}%`}
          icon={TrendingUp}
        />
        <KPICard label="Published Courses" value={publishedCount} icon={Eye} />
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
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BarChart3 />
                  </EmptyMedia>
                  <EmptyTitle>No course data available</EmptyTitle>
                  <EmptyDescription>
                    Create a course to see enrollment metrics here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Detailed metrics per course</CardDescription>
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
                          <Progress
                            value={course.avgProgress}
                            className="h-2 w-16"
                          />
                          <span className="text-sm">{course.avgProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            course.completionRate >= 50
                              ? "default"
                              : "secondary"
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
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpen />
                  </EmptyMedia>
                  <EmptyTitle>No courses yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first course to see metrics.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
