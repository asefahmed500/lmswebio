"use client"

import * as React from "react"
import {
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  CalendarDays,
  Loader2,
} from "lucide-react"
import { apiGet } from "@/lib/api-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface AnalyticsData {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  activeUsers: number
  userGrowth: { date: string; count: number }[]
  enrollmentGrowth: { date: string; count: number }[]
}

function aggregateByMonth(
  data: { date: string; count: number }[]
): { month: string; count: number }[] {
  const map = new Map<string, number>()
  for (const item of data) {
    const month = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
    map.set(month, (map.get(month) || 0) + item.count)
  }
  return Array.from(map.entries()).map(([month, count]) => ({
    month,
    count,
  }))
}

export default function AdminEnrollmentsAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    apiGet<{ analytics: AnalyticsData }>("/analytics?type=platform")
      .then((res) => {
        if (!cancelled && res.data) setData(res.data.analytics || null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading enrollment analytics...
          </p>
        </div>
      </div>
    )
  }

  const enrollmentByMonth = data ? aggregateByMonth(data.enrollmentGrowth) : []
  const usersByMonth = data ? aggregateByMonth(data.userGrowth) : []

  const combinedChartData = enrollmentByMonth.map((e) => {
    const userEntry = usersByMonth.find((u) => u.month === e.month)
    return {
      month: e.month,
      enrollments: e.count,
      newUsers: userEntry?.count ?? 0,
    }
  })

  const kpis = [
    {
      label: "Total Users",
      value: data?.totalUsers ?? 0,
      icon: Users,
    },
    {
      label: "Total Enrollments",
      value: data?.totalEnrollments ?? 0,
      icon: GraduationCap,
    },
    {
      label: "Active Users",
      value: data?.activeUsers ?? 0,
      icon: Activity,
    },
    {
      label: "Enrollments per User",
      value:
        data && data.totalUsers > 0
          ? (data.totalEnrollments / data.totalUsers).toFixed(1)
          : "0",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Enrollment Analytics
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track user growth and enrollment trends across the platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Enrollments & User Growth
          </CardTitle>
          <CardDescription>
            Monthly comparison of new enrollments and new user registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {combinedChartData.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Enrollments"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="New Users"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
              No enrollment data available yet
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Enrollment Distribution
            </CardTitle>
            <CardDescription>Total enrollments per month</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentByMonth.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentByMonth}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis className="text-xs text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Enrollments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No enrollment data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              User Registration Trend
            </CardTitle>
            <CardDescription>New user registrations per month</CardDescription>
          </CardHeader>
          <CardContent>
            {usersByMonth.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersByMonth}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis className="text-xs text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      name="New Users"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No user registration data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
