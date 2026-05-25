import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  courseId: z.number(),
  timeLimit: z.number().optional(),
  attemptsAllowed: z.number().default(1),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    const where: any = {}
    if (courseId) {
      where.courseId = Number(courseId)
    }

    if (session.user.role === "INSTRUCTOR") {
      const courses = await prisma.course.findMany({
        where: { instructorId: session.user.id },
        select: { id: true },
      })
      where.courseId = { in: courses.map((c) => c.id) }
    } else if (session.user.role === "STUDENT") {
      const enrollments = await prisma.enrolment.findMany({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
        },
        select: { courseId: true },
      })
      where.courseId = { in: enrollments.map((e) => e.courseId) }
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error("Get quizzes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createQuizSchema.parse(body)

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
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

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        courseId: data.courseId,
        timeLimit: data.timeLimit,
        attemptsAllowed: data.attemptsAllowed,
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create quiz error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
