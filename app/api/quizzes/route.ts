import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  courseId: z.string(),
  timeLimit: z.number().optional(),
  attemptsAllowed: z.number().default(1),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        type: z.enum(["MC_SINGLE", "MC_MULTI", "TEXT", "TRUE_FALSE"]),
        points: z.number().min(0).default(1),
        options: z.record(z.string(), z.string()).optional(),
        correctAnswer: z.unknown().optional(),
      })
    )
    .optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    const where: Prisma.QuizWhereInput = {}

    if (session.user.role === "INSTRUCTOR") {
      const courses = await prisma.course.findMany({
        where: { instructorId: session.user.id },
        select: { id: true },
      })
      const allowedIds = courses.map((c) => c.id)
      if (courseId) {
        const cid = courseId
        if (!allowedIds.includes(cid)) {
          return NextResponse.json({ quizzes: [], pagination: { total: 0 } })
        }
        where.courseId = cid
      } else {
        where.courseId = { in: allowedIds }
      }
    } else if (session.user.role === "STUDENT") {
      const enrollments = await prisma.enrolment.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        select: { courseId: true },
      })
      const allowedIds = enrollments.map((e) => e.courseId)
      if (courseId) {
        const cid = courseId
        if (!allowedIds.includes(cid)) {
          return NextResponse.json({ quizzes: [], pagination: { total: 0 } })
        }
        where.courseId = cid
      } else {
        where.courseId = { in: allowedIds }
      }
    } else if (courseId) {
      where.courseId = courseId
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

    // Create questions if provided
    if (data.questions && data.questions.length > 0) {
      await prisma.quizQuestion.createMany({
        data: data.questions.map(
          (
            q
          ): {
            quizId: string
            text: string
            type: "MC_SINGLE" | "MC_MULTI" | "TEXT" | "TRUE_FALSE"
            points: number
            options?: Record<string, string>
            correctAnswer?: Prisma.InputJsonValue
          } => ({
            quizId: quiz.id,
            text: q.text,
            type: q.type as "MC_SINGLE" | "MC_MULTI" | "TEXT" | "TRUE_FALSE",
            points: q.points,
            options: q.options as Record<string, string> | undefined,
            correctAnswer: q.correctAnswer as Prisma.InputJsonValue | undefined,
          })
        ),
      })
    }

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
