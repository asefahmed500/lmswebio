import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { createEnrollmentSchema } from "@/lib/validators/enrollments"
import { z } from "zod"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"

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

      const enrollments = await prisma.enrolment.findMany({
        where: { courseId: courseId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      })

      return NextResponse.json({ enrollments })
    }

    const enrollments = await prisma.enrolment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Get enrollments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const identifier = `${getRateLimitIdentifier(request)}:enrollment-create`
    const rl = await rateLimit(identifier, {
      maxRequests: 20,
      windowMs: 60_000,
    })
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const data = createEnrollmentSchema.parse(body)

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: "Course is not available for enrollment" },
        { status: 400 }
      )
    }

    const existingEnrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: data.courseId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 409 }
      )
    }

    const enrollment = await prisma.enrolment.create({
      data: {
        userId: session.user.id,
        courseId: data.courseId,
        status: "ACTIVE",
        progress: 0,
      },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create enrollment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
