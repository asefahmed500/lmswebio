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
      return NextResponse.json(
        { error: "Only students can enroll" },
        { status: 403 }
      )
    }

    const { id: courseId } = await params

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: "Course is not published" },
        { status: 400 }
      )
    }

    const existing = await prisma.enrolment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 })
    }

    // For paid courses, redirect to checkout instead of direct enrollment
    if (course.price && course.price > 0) {
      return NextResponse.json(
        {
          requiresPayment: true,
          courseId: course.id,
          price: course.price,
          checkoutUrl: `/student/checkout/${course.id}`,
        },
        { status: 200 }
      )
    }

    const enrolment = await prisma.enrolment.create({
      data: { userId, courseId },
      include: {
        course: { select: { id: true, title: true } },
      },
    })

    // Persist a single confirmation notification. The UI shows the matching
    // toast; the database copy makes it visible in the notification centre
    // after navigation and survives a reload.
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: "You're enrolled",
          message: `You're now learning ${course.title}.`,
          type: "success",
          link: `/student/courses/${course.id}`,
        },
      })
    } catch (error) {
      console.error("Failed to create enrolment notification:", error)
    }

    return NextResponse.json(enrolment, { status: 201 })
  } catch (error) {
    console.error("POST /api/courses/[id]/enrol error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
