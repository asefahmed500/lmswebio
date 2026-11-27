import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"
import { z } from "zod"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"
import { gradeAnswer } from "@/lib/quiz"

class AttemptLimitError extends Error {}

const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
})

export async function POST(
  request: NextRequest,
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
        { error: "Only students can attempt quizzes" },
        { status: 403 }
      )
    }

    const identifier = `${getRateLimitIdentifier(request)}:quiz-attempt`
    const rl = await rateLimit(identifier, {
      maxRequests: 10,
      windowMs: 60_000,
    })
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id: quizId } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, course: { select: { id: true } } },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check enrollment
    const isEnrolled = await prisma.enrolment.findUnique({
      where: { userId_courseId: { userId, courseId: quiz.course.id } },
    })

    if (!isEnrolled) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to attempt quizzes" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = submitQuizSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { answers } = parsed.data

    let totalPoints = 0
    let earnedPoints = 0
    let needsManualGrading = false

    for (const question of quiz.questions) {
      const fraction = gradeAnswer(
        question.type,
        question.correctAnswer,
        answers[question.id]
      )
      if (fraction === null) {
        // Text/essay answers are excluded from the automatic score and must
        // be graded by the instructor.
        needsManualGrading = true
        continue
      }
      totalPoints += question.points
      earnedPoints += question.points * fraction
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

    // The attempt-limit check and insert must be atomic, otherwise concurrent
    // submissions can bypass attemptsAllowed.
    const attempt = await prisma.$transaction(async (tx) => {
      const existingAttempts = await tx.quizAttempt.count({
        where: { quizId, userId },
      })
      if (existingAttempts >= quiz.attemptsAllowed) {
        throw new AttemptLimitError()
      }

      return tx.quizAttempt.create({
        data: {
          quizId,
          userId,
          score: needsManualGrading ? null : Math.round(score * 100) / 100,
          answers,
        },
        include: { quiz: { select: { id: true, title: true } } },
      })
    })

    return NextResponse.json(
      { ...attempt, needsManualGrading },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AttemptLimitError) {
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 403 }
      )
    }
    console.error("POST /api/quizzes/[id]/attempt error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = session.user
    const { id: quizId } = await params

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            questions: {
              select: {
                id: true,
                text: true,
                type: true,
                points: true,
                options: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error("GET /api/quizzes/[id]/attempt error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
