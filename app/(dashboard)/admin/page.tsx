"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { apiGet } from "@/lib/api-client"
import type { KPICard, WeeklyEnrollment, User as UserType } from "@/types"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
          <Activity className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        {kpi.change !== undefined && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {isPositive && <ArrowUpRight className="text-success size-3" />}
            {isNegative && (
              <ArrowDownRight className="size-3 text-destructive" />
            )}
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

function EnrollmentChart({ data }: { data: WeeklyEnrollment[] }) {
  const chartData = {
    labels: data.map((d) => d.week),
    datasets: [
      {
        label: "New Enrollments",
        data: data.map((d) => d.enrollments),
        borderColor: "hsl(var(--chart-1))",
        backgroundColor: "hsl(var(--chart-1) / 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "hsl(var(--border))",
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }

  return (
    <div className="h-[300px] w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = React.useState<KPICard[]>([])
  const [enrollmentData, setEnrollmentData] = React.useState<
    WeeklyEnrollment[]
  >([])
  const [recentUsers, setRecentUsers] = React.useState<UserType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [analyticsRes, usersRes, coursesRes] = await Promise.all([
          apiGet<{
            analytics?: {
              totalUsers?: number
              totalEnrollments?: number
              activeUsers?: number
              enrollmentGrowth?: Array<{ date: string; count: number }>
            }
          }>("/analytics?type=platform"),
          apiGet<{ users: UserType[] }>("/admin/users"),
          apiGet<{ courses: unknown[] }>("/courses"),
        ])

        const analyticsData = analyticsRes.data ?? {}
        const usersData = usersRes.data ?? { users: [] }
        const coursesData = coursesRes.data ?? { courses: [] }

        const kpiData: KPICard[] = [
          {
            label: "Total Users",
            value: String(analyticsData.analytics?.totalUsers ?? 0),
            trend: "up",
          },
          {
            label: "Total Courses",
            value: String(coursesData.courses?.length ?? 0),
            trend: "up",
          },
          {
            label: "Total Enrollments",
            value: String(analyticsData.analytics?.totalEnrollments ?? 0),
            trend: "up",
          },
          {
            label: "Active Users",
            value: String(analyticsData.analytics?.activeUsers ?? 0),
            trend: "up",
          },
        ]

        const enrollmentGrowth = analyticsData.analytics?.enrollmentGrowth || []
        const enrollmentChartData: WeeklyEnrollment[] = enrollmentGrowth.map(
          (item: { date: string; count: number }) => ({
            week: new Date(item.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            enrollments: item.count,
          })
        )

        const recentUsersData = usersData.users
          ?.sort(
            (a: UserType, b: UserType) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)

        setKpis(kpiData)
        setEnrollmentData(enrollmentChartData)
        setRecentUsers(recentUsersData || [])
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of platform performance and user activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KPICardComponent key={index} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Weekly Enrollments</CardTitle>
            <CardDescription>
              New student enrollments over the past 8 weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollmentChart data={enrollmentData} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Latest user registrations on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback>
                      {user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-none font-medium">
                      {user.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/users/new">
                <Users data-icon="inline-start" />
                Add User
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/courses/new">
                <BookOpen data-icon="inline-start" />
                Add Course
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/analytics">
                <TrendingUp data-icon="inline-start" />
                View Reports
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
