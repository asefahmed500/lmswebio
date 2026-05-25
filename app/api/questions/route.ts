import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createQuestionSchema = z.object({
  quizId: z.number(),
  text: z.string().min(1),
  type: z.enum(["MC_SINGLE", "MC_MULTI", "TEXT", "TRUE_FALSE"]),
  points: z.number().default(1),
  options: z.any().optional(),
  correctAnswer: z.any().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createQuestionSchema.parse(body)

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      include: { course: true },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      quiz.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const question = await prisma.quizQuestion.create({
      data: {
        quizId: data.quizId,
        text: data.text,
        type: data.type,
        points: data.points,
        options: data.options,
        correctAnswer: data.correctAnswer,
      },
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create question error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
