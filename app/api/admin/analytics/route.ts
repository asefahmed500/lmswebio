import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [
      totalUsers,
      totalInstructors,
      totalStudents,
      totalCourses,
      totalPublished,
      totalEnrolments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "INSTRUCTOR" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrolment.count(),
    ])

    const [coursesByLevel, weeklyEnrolmentsRaw, avgProgress, completions] =
      await Promise.all([
        prisma.course.groupBy({
          by: ["level"],
          _count: true,
        }),
        prisma.enrolment.findMany({
          select: { enrolledAt: true },
          orderBy: { enrolledAt: "desc" },
          take: 90,
        }),
        prisma.enrolment.aggregate({
          _avg: { progress: true },
        }),
        prisma.enrolment.count({
          where: { status: "COMPLETED" },
        }),
      ])

    const weekMap = new Map<string, number>()
    for (const e of weeklyEnrolmentsRaw) {
      const d = new Date(e.enrolledAt)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toISOString().split("T")[0]
      weekMap.set(key, (weekMap.get(key) || 0) + 1)
    }

    const weeklyData = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, enrollments]) => ({ week, enrollments }))

    return NextResponse.json({
      totalUsers,
      totalInstructors,
      totalStudents,
      totalCourses,
      totalPublished,
      totalEnrolments,
      averageProgress: Math.round(avgProgress._avg.progress ?? 0),
      completions,
      coursesByLevel: coursesByLevel.map((l) => ({
        level: l.level,
        count: l._count,
      })),
      weeklyEnrolments: weeklyData,
    })
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
