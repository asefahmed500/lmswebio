import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user

    if (role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can complete lessons" }, { status: 403 })
    }

    const { id } = await params
    const lessonId = parseInt(id, 10)

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 })
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { id: true, courseId: true },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const courseId = lesson.module.courseId

    await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId },
      update: {},
    })

    await prisma.enrolment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: "ACTIVE" },
      update: {},
    })

    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId } },
    })

    const completedLessons = await prisma.lessonCompletion.count({
      where: { userId, lesson: { module: { courseId } } },
    })

    const progress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    await prisma.enrolment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { progress },
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error("POST /api/lessons/[id]/complete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
