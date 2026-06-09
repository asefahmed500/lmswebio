import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user
    if (role !== "ADMIN" && role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const whereClause = role === "INSTRUCTOR" ? { instructorId: userId } : {}

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        enrolments: {
          select: {
            status: true,
            progress: true,
            enrolledAt: true,
          },
        },
      },
    })

    const coursePerformance = courses.map((course) => {
      const total = course.enrolments.length
      const completed = course.enrolments.filter(
        (e) => e.status === "COMPLETED"
      ).length
      const avgProgress =
        total > 0
          ? Math.round(
              course.enrolments.reduce((sum, e) => sum + e.progress, 0) / total
            )
          : 0

      return {
        courseId: course.id,
        courseTitle: course.title,
        enrolled: total,
        completed,
        avgProgress,
      }
    })

    const monthlyEnrollments: { month: string; count: number }[] = []
    const monthMap = new Map<string, number>()

    for (const course of courses) {
      for (const enrolment of course.enrolments) {
        const d = new Date(enrolment.enrolledAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        monthMap.set(key, (monthMap.get(key) || 0) + 1)
      }
    }

    for (const [month, count] of monthMap.entries()) {
      monthlyEnrollments.push({ month, count })
    }
    monthlyEnrollments.sort((a, b) => a.month.localeCompare(b.month))

    const completionRates = courses.map((course) => {
      const total = course.enrolments.length
      const completed = course.enrolments.filter(
        (e) => e.status === "COMPLETED"
      ).length
      return {
        courseId: course.id,
        courseTitle: course.title,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })

    return NextResponse.json({
      coursePerformance,
      monthlyEnrollments,
      completionRates,
    })
  } catch (error) {
    console.error("GET /api/instructors/analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
