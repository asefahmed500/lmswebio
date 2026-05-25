import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  type: z.enum(["MC_SINGLE", "MC_MULTI", "TEXT", "TRUE_FALSE"]).optional(),
  points: z.number().optional(),
  options: z.any().optional(),
  correctAnswer: z.any().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const question = await prisma.quizQuestion.findUnique({
      where: { id: Number((await params).id) },
      include: {
        quiz: {
          include: { course: true },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      question.quiz.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateQuestionSchema.parse(body)

    const updatedQuestion = await prisma.quizQuestion.update({
      where: { id: Number((await params).id) },
      data,
    })

    return NextResponse.json({ question: updatedQuestion })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update question error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const question = await prisma.quizQuestion.findUnique({
      where: { id: Number((await params).id) },
      include: {
        quiz: {
          include: { course: true },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      question.quiz.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.quizQuestion.delete({
      where: { id: Number((await params).id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
