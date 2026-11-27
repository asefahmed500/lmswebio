import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const enrollment = await prisma.enrolment.findUnique({
      where: { id: (await params).id },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      )
    }

    if (
      session.user.role !== "ADMIN" &&
      enrollment.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.enrolment.update({
      where: { id: (await params).id },
      data: { status: "DROPPED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete enrollment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const enrollment = await prisma.enrolment.findUnique({
      where: { id: (await params).id },
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

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      )
    }

    const isOwner = enrollment.userId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    const isCourseInstructor =
      session.user.role === "INSTRUCTOR" &&
      enrollment.course.instructorId === session.user.id

    if (!isOwner && !isAdmin && !isCourseInstructor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Always measure the enrolment owner's completions — never the viewer's.
    // A GET must not mutate stored progress; it only reports the derived value.
    const completedLessons = await prisma.lessonCompletion.count({
      where: {
        userId: enrollment.userId,
        lesson: {
          module: {
            courseId: enrollment.courseId,
          },
        },
      },
    })

    const totalLessons = enrollment.course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0
    )

    const progress =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    return NextResponse.json({
      enrollment: {
        ...enrollment,
        progress,
        completedLessons,
        totalLessons,
      },
    })
  } catch (error) {
    console.error("Get enrollment progress error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
