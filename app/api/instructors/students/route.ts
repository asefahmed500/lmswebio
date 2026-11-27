import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/instructors/students
 * Student performance for courses taught by the signed-in instructor.
 */
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

    const courses = await prisma.course.findMany({
      where: role === "INSTRUCTOR" ? { instructorId: userId } : {},
      select: { id: true, title: true },
    })

    const courseIds = courses.map((course) => course.id)
    const titles = new Map(courses.map((course) => [course.id, course.title]))

    const enrolments = await prisma.enrolment.findMany({
      where:
        courseIds.length > 0 ? { courseId: { in: courseIds } } : { id: "" },
      select: {
        userId: true,
        courseId: true,
        progress: true,
        status: true,
        lastAccessedAt: true,
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    })

    const byUser = new Map<string, (typeof enrolments)[number][]>()
    for (const enrolment of enrolments) {
      const list = byUser.get(enrolment.userId) ?? []
      list.push(enrolment)
      byUser.set(enrolment.userId, list)
    }

    const students = [...byUser.entries()].map(([id, rows]) => ({
      userId: id,
      fullName: rows[0].user.fullName,
      email: rows[0].user.email,
      avatarUrl: rows[0].user.avatarUrl,
      enrolledCount: rows.length,
      completedCount: rows.filter((row) => row.status === "COMPLETED").length,
      avgProgress: Math.round(
        rows.reduce((sum, row) => sum + row.progress, 0) / rows.length
      ),
      lastAccessedAt: rows
        .map((row) => row.lastAccessedAt)
        .filter(Boolean)
        .sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0],
      courses: rows.map((row) => ({
        courseId: row.courseId,
        courseTitle: titles.get(row.courseId) ?? "Course",
        progress: row.progress,
        status: row.status,
      })),
    }))

    students.sort((a, b) => b.avgProgress - a.avgProgress)

    return NextResponse.json({ students })
  } catch (error) {
    console.error("GET /api/instructors/students error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
