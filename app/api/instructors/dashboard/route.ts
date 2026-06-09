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
        _count: {
          select: {
            enrolments: true,
            quizzes: true,
            assignments: true,
          },
        },
      },
    })

    const totalCourses = courses.length
    const totalStudents = courses.reduce(
      (sum, c) => sum + c._count.enrolments,
      0
    )
    const totalQuizzes = courses.reduce((sum, c) => sum + c._count.quizzes, 0)
    const totalAssignments = courses.reduce(
      (sum, c) => sum + c._count.assignments,
      0
    )

    const courseIds = courses.map((c) => c.id)
    const recentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          courseId: { in: courseIds },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      totalCourses,
      totalStudents,
      totalQuizzes,
      totalAssignments,
      recentSubmissions,
    })
  } catch (error) {
    console.error("GET /api/instructors/dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
