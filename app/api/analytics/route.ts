import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "platform"
    const courseId = searchParams.get("courseId")

    if (type === "platform" && session.user.role === "ADMIN") {
      const [totalUsers, totalCourses, totalEnrollments, activeUsers] =
        await Promise.all([
          prisma.user.count(),
          prisma.course.count(),
          prisma.enrolment.count(),
          prisma.user.count({
            where: {
              enrolments: {
                some: {
                  status: "ACTIVE",
                  lastAccessedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          }),
        ])

      const [userGrowth, enrollmentGrowth] = await Promise.all([
        prisma.user.findMany({
          select: {
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.enrolment.findMany({
          select: {
            enrolledAt: true,
          },
          orderBy: { enrolledAt: "asc" },
        }),
      ])

      // Aggregate enrollments by week
      const weekMap = new Map<string, number>()
      for (const e of enrollmentGrowth) {
        const d = new Date(e.enrolledAt)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const key = weekStart.toISOString().split("T")[0]
        weekMap.set(key, (weekMap.get(key) || 0) + 1)
      }
      const aggregatedEnrollmentGrowth = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }))

      return NextResponse.json({
        analytics: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          activeUsers,
          userGrowth: userGrowth.map((u) => ({ date: u.createdAt, count: 1 })),
          enrollmentGrowth: aggregatedEnrollmentGrowth,
        },
      })
    }

    if (type === "course" && courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrolments: {
            where: { status: { in: ["ACTIVE", "COMPLETED"] } },
          },
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      })

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 })
      }

      if (
        session.user.role === "INSTRUCTOR" &&
        course.instructorId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const totalLessons = course.modules.reduce(
        (sum: number, m: { lessons: { length: number } }) =>
          sum + m.lessons.length,
        0
      )
      const totalEnrollments = course.enrolments.length
      const completedEnrollments = course.enrolments.filter(
        (e: { status: string }) => e.status === "COMPLETED"
      ).length
      const avgProgress =
        course.enrolments.reduce(
          (sum: number, e: { progress: number }) => sum + e.progress,
          0
        ) / (totalEnrollments || 1)

      return NextResponse.json({
        analytics: {
          totalEnrollments,
          completedEnrollments,
          avgProgress,
          totalLessons,
          completionRate:
            totalEnrollments > 0
              ? (completedEnrollments / totalEnrollments) * 100
              : 0,
        },
      })
    }

    if (type === "user") {
      const userId =
        session.user.role === "STUDENT"
          ? session.user.id
          : searchParams.get("userId")

      if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 })
      }

      const enrollments = await prisma.enrolment.findMany({
        where: {
          userId,
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: true,
                },
              },
            },
          },
        },
      })

      const totalCourses = enrollments.length
      const completedCourses = enrollments.filter(
        (e) => e.status === "COMPLETED"
      ).length
      const avgProgress =
        enrollments.reduce((sum, e) => sum + e.progress, 0) /
        (totalCourses || 1)

      return NextResponse.json({
        analytics: {
          totalCourses,
          completedCourses,
          avgProgress,
        },
      })
    }

    return NextResponse.json(
      { error: "Invalid analytics type" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Get analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
