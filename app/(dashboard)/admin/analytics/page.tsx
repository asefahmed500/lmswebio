"use client"

import * as React from "react"
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCog,
  Activity,
  TrendingUp,
  BarChart3,
  Loader2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import { apiGet } from "@/lib/api-client"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

/**
 * Mirrors the response of GET /api/admin/analytics.
 *
 * Note the mixed spelling, which is the route's, not a typo here: the outer key
 * is `weeklyEnrolments` (matching the Prisma `Enrolment` model) while each entry
 * is built as `{ week, enrollments }` with a double-L. This interface previously
 * declared `totalEnrollments`, `weeklyEnrollments` and `count`, so
 * `weeklyEnrollments.map(...)` threw "Cannot read properties of undefined" on
 * every successful load and the Enrollments KPI always rendered 0.
 */
interface AnalyticsData {
  totalUsers: number
  totalInstructors: number
  totalStudents: number
  totalCourses: number
  totalPublished: number
  totalEnrolments: number
  averageProgress: number
  completions: number
  weeklyEnrolments: { week: string; enrollments: number }[]
  coursesByLevel: { level: string; count: number }[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    apiGet<AnalyticsData>("/admin/analytics")
      .then((res) => {
        if (!cancelled && res.data) setData(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Guard the shape: a malformed payload must render an empty chart, not throw.
  const weekly = Array.isArray(data?.weeklyEnrolments)
    ? data.weeklyEnrolments
    : []

  const weeklyChartData = data
    ? {
        labels: weekly.map((d) => d.week),
        datasets: [
          {
            label: "Enrollments",
            data: weekly.map((d) => d.enrollments),
            borderColor: "var(--chart-1)",
            backgroundColor:
              "color-mix(in srgb, var(--chart-1) 10%, transparent)",
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null

  const levelChartData = data
    ? {
        labels: data.coursesByLevel.map((d) => d.level),
        datasets: [
          {
            label: "Courses",
            data: data.coursesByLevel.map((d) => d.count),
            backgroundColor: [
              "var(--chart-2)",
              "var(--chart-3)",
              "var(--chart-5)",
            ],
            borderRadius: 0,
          },
        ],
      }
    : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: "hsl(var(--border))" } },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }

  const barOptions = {
    ...chartOptions,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: "hsl(var(--border))" },
        ticks: { stepSize: 1 },
      },
    },
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const kpis = [
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users },
    {
      label: "Instructors",
      value: data?.totalInstructors ?? 0,
      icon: UserCog,
    },
    {
      label: "Students",
      value: data?.totalStudents ?? 0,
      icon: GraduationCap,
    },
    { label: "Total Courses", value: data?.totalCourses ?? 0, icon: BookOpen },
    {
      label: "Published",
      value: data?.totalPublished ?? 0,
      icon: BookOpen,
    },
    {
      label: "Enrollments",
      value: data?.totalEnrolments ?? 0,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide metrics and performance data
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} size="sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
                <kpi.icon className="h-3.5 w-3.5" />
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Weekly Enrollments
            </CardTitle>
            <CardDescription>
              Student enrollments over recent weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyChartData ? (
              <div className="h-[300px] w-full">
                <Line data={weeklyChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No enrollment data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Courses by Level
            </CardTitle>
            <CardDescription>
              Distribution across difficulty levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {levelChartData ? (
              <div className="h-[300px] w-full">
                <Bar data={levelChartData} options={barOptions} />
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No course data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Average Progress
            </CardTitle>
            <CardDescription>
              Mean student completion progress across all courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(data?.averageProgress ?? 0)}%
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Completed Courses
            </CardTitle>
            <CardDescription>
              Total number of course completions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.completions ?? 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
