import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

const gradeSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().max(2000).optional(),
})

/**
 * POST /api/quizzes/[id]/attempt/[attemptId]
 * Manually grade an attempt that contains text/essay answers.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: quizId, attemptId } = await params

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: {
            courseId: true,
            course: { select: { instructorId: true } },
          },
        },
      },
    })

    if (!attempt || attempt.quizId !== quizId) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      attempt.quiz.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = gradeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { score: Math.round(parsed.data.score * 100) / 100 },
    })

    return NextResponse.json({ attempt: updated })
  } catch (error) {
    console.error("Grade quiz attempt error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
