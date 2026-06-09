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
    const courseId = searchParams.get("courseId")

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
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

      if (session.user.role === "STUDENT" && !course.isPublished) {
        const enrollment = await prisma.enrolment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: courseId,
            },
          },
        })
        if (!enrollment) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }

      const completedLessons = await prisma.lessonCompletion.findMany({
        where: {
          userId: session.user.id,
          lesson: {
            module: {
              courseId: courseId,
            },
          },
        },
        include: {
          lesson: true,
        },
      })

      const totalLessons = course.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      )

      const progress =
        totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0

      const moduleProgress = course.modules.map((module) => {
        const moduleCompletedLessons = completedLessons.filter(
          (cl) => cl.lesson.moduleId === module.id
        ).length
        return {
          id: module.id,
          title: module.title,
          completedLessons: moduleCompletedLessons,
          totalLessons: module.lessons.length,
          progress:
            module.lessons.length > 0
              ? (moduleCompletedLessons / module.lessons.length) * 100
              : 0,
        }
      })

      return NextResponse.json({
        progress,
        totalLessons,
        completedLessons: completedLessons.length,
        moduleProgress,
        completedLessonIds: completedLessons.map((cl) => cl.lessonId),
      })
    }

    // Overall progress across all enrolled courses
    const enrollments = await prisma.enrolment.findMany({
      where: { userId: session.user.id },
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

    // Get all lesson completions for this user
    const allCompletions = await prisma.lessonCompletion.findMany({
      where: { userId: session.user.id },
      select: { lessonId: true },
    })
    const completedLessonIds = new Set(allCompletions.map((c) => c.lessonId))

    let totalCompletedLessons = 0
    let totalLessons = 0
    const courseProgress = enrollments.map((enrollment) => {
      const courseTotalLessons = enrollment.course.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      )

      const completedCount = enrollment.course.modules.reduce((sum, module) => {
        return (
          sum +
          module.lessons.filter((lesson) => completedLessonIds.has(lesson.id))
            .length
        )
      }, 0)

      totalCompletedLessons += completedCount
      totalLessons += courseTotalLessons

      return {
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        progress:
          courseTotalLessons > 0
            ? (completedCount / courseTotalLessons) * 100
            : 0,
        completedLessons: completedCount,
        totalLessons: courseTotalLessons,
      }
    })

    const overallProgress =
      totalLessons > 0 ? (totalCompletedLessons / totalLessons) * 100 : 0

    return NextResponse.json({
      overallProgress,
      totalCompletedLessons,
      totalLessons,
      courseProgress,
    })
  } catch (error) {
    console.error("Get progress error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
