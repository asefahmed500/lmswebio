/**
 * Student achievements page
 * Shows badges earned, certificates, and completion stats
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { Award, Trophy, BookOpen, TrendingUp, CheckCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BadgeDisplay } from "@/components/badges/badge-display"
import { CertificateViewer } from "@/components/certificates/certificate-viewer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import type { Enrollment, Course } from "@/types"

interface ApiEnrollment {
  id: string
  userId: string
  courseId: string
  status: string
  progress: number
  lastAccessedAt: string | null
  completedAt: string | null
  enrolledAt: string
  course: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnail: string | null
    level: string
    isPublished: boolean
    instructorId: string
    instructor: { id: string; fullName: string } | null
    category: string | null
    tags: string[]
    modules: { id: string; lessonCount: number }[]
    createdAt: string
  }
}

interface BadgeItem {
  id: string
  name: string
  slug: string
  description: string
  iconUrl: string | null
  points: number
  earned: boolean
  earnedAt: Date | null
}

interface CertificateItem {
  id: string
  certificateUrl: string
  verificationId: string
  issuedAt: string
  course: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
  }
  user: {
    fullName: string
    email: string
  }
}

function mapEnrollment(api: ApiEnrollment): Enrollment {
  const c = api.course
  const course: Course = {
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
          email: "",
          fullName: c.instructor.fullName,
          role: "INSTRUCTOR" as const,
          createdAt: "",
        }
      : undefined,
    modules: c.modules.map((m) => ({
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
  }
  return {
    id: api.id,
    userId: api.userId,
    courseId: api.courseId,
    status: api.status as Enrollment["status"],
    progress: api.progress,
    lastAccessedAt: api.lastAccessedAt ?? undefined,
    completedAt: api.completedAt ?? undefined,
    enrolledAt: api.enrolledAt,
    course,
  }
}

export default function AchievementsPage() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [badges, setBadges] = React.useState<BadgeItem[]>([])
  const [certificates, setCertificates] = React.useState<CertificateItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        const [enrollmentsResult, badgesResult, certificatesResult] =
          await Promise.all([
            apiGet<ApiEnrollment[]>("/enrolments/my"),
            apiGet<Record<string, BadgeItem[]>>("/badges"),
            apiGet<Record<string, CertificateItem[]>>("/certificates"),
          ])

        if (enrollmentsResult.data) {
          setEnrollments(enrollmentsResult.data.map(mapEnrollment))
        }

        if (badgesResult.data) {
          setBadges(badgesResult.data.badges)
        }

        if (certificatesResult.data) {
          setCertificates(certificatesResult.data.certificates)
        }
      } catch (error) {
        console.error("Failed to load achievements:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  const completedCourses = React.useMemo(
    () => enrollments.filter((e) => e.progress >= 100),
    [enrollments]
  )

  const stats = React.useMemo(() => {
    const enrolled = enrollments.length
    const completed = completedCourses.length
    const avgProgress =
      enrolled > 0
        ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrolled
        : 0
    const earnedBadges = badges.filter((b) => b.earned).length
    const totalPoints = badges.reduce(
      (sum, b) => sum + (b.earned ? b.points : 0),
      0
    )

    return { enrolled, completed, avgProgress, earnedBadges, totalPoints }
  }, [enrollments, completedCourses, badges])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading achievements...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="mt-1 text-muted-foreground">
          Track your learning milestones, badges, and certificates
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enrolled Courses
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <BookOpen className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Courses
            </CardTitle>
            <div className="bg-success/10 rounded-full p-2">
              <CheckCircle className="text-success size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Progress
            </CardTitle>
            <div className="bg-warning/10 rounded-full p-2">
              <TrendingUp className="text-warning size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgProgress.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Badges Earned
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Award className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.earnedBadges}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Points
            </CardTitle>
            <div className="bg-warning/10 rounded-full p-2">
              <Trophy className="text-warning size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {stats.completed} of {stats.enrolled} courses completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={
              stats.enrolled > 0 ? (stats.completed / stats.enrolled) * 100 : 0
            }
            className="h-3"
          />
        </CardContent>
      </Card>

      {/* Badges Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="size-6 text-primary" />
            <h2 className="text-xl font-semibold">Badges</h2>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/achievements/badges">View All Badges</Link>
          </Button>
        </div>
        <BadgeDisplay badges={badges} maxDisplay={8} />
      </div>

      {/* Certificates Section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="text-warning size-6" />
          <h2 className="text-xl font-semibold">Certificates</h2>
        </div>
        {certificates.length > 0 ? (
          <div className="flex flex-col gap-6">
            {certificates.map((cert) => (
              <CertificateViewer key={cert.id} certificate={cert} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="py-8 text-center">
                <Award className="mx-auto mb-4 size-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No certificates yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Complete a course to earn your first certificate.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
