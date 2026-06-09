import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: enrollmentId } = await params

    const enrollment = await prisma.enrolment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true, title: true },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      )
    }

    const { role, id: userId } = session.user
    const isOwner = enrollment.userId === userId
    const isAdminOrInstructor = role === "ADMIN" || role === "INSTRUCTOR"

    if (!isOwner && !isAdminOrInstructor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons)
    const totalLessons = allLessons.length

    const completedLessons = await prisma.lessonCompletion.findMany({
      where: {
        userId: enrollment.userId,
        lesson: {
          module: {
            courseId: enrollment.courseId,
          },
        },
      },
      select: {
        lessonId: true,
        completedAt: true,
      },
    })

    const completedLessonIds = completedLessons.map((cl) => cl.lessonId)
    const progress =
      totalLessons > 0
        ? Math.round((completedLessonIds.length / totalLessons) * 100)
        : 0

    const lastCompletedLesson =
      completedLessons.length > 0
        ? completedLessons.reduce((latest, curr) =>
            curr.completedAt > latest.completedAt ? curr : latest
          )
        : null

    let lastAccessedModule = null
    if (lastCompletedLesson) {
      for (const mod of enrollment.course.modules) {
        const hasLesson = mod.lessons.some(
          (l) => l.id === lastCompletedLesson.lessonId
        )
        if (hasLesson) {
          lastAccessedModule = {
            moduleId: mod.id,
            moduleTitle: mod.title,
            lessonId: lastCompletedLesson.lessonId,
          }
          break
        }
      }
    }

    return NextResponse.json({
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      completedLessonIds,
      totalLessons,
      progress,
      lastAccessedModule,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    })
  } catch (error) {
    console.error("GET /api/enrollments/[id]/progress error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
