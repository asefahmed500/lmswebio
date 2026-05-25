import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

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
      return NextResponse.json({ error: "Only students can attempt quizzes" }, { status: 403 })
    }

    const { id } = await params
    const quizId = parseInt(id)

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const existingAttempts = await prisma.quizAttempt.count({
      where: { quizId, userId },
    })

    if (existingAttempts >= quiz.attemptsAllowed) {
      return NextResponse.json({ error: "Maximum attempts reached" }, { status: 403 })
    }

    const body = await request.json()
    const { answers } = body

    if (!answers) {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 })
    }

    let totalPoints = 0
    let earnedPoints = 0

    for (const question of quiz.questions) {
      totalPoints += question.points
      const userAnswer = answers[question.id.toString()]

      if (!userAnswer) continue

      if (question.type === "MC_SINGLE" || question.type === "TRUE_FALSE") {
        if (userAnswer === question.correctAnswer) {
          earnedPoints += question.points
        }
      } else if (question.type === "MC_MULTI") {
        const correct = (question.correctAnswer as string[]) || []
        const userAns = (userAnswer as string[]) || []
        const matchedCount = userAns.filter((a: string) => correct.includes(a)).length
        if (matchedCount > 0 && correct.length > 0) {
          earnedPoints += (question.points * matchedCount) / correct.length
        }
      }
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score: Math.round(score * 100) / 100,
        answers,
      },
      include: {
        quiz: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json(attempt, { status: 201 })
  } catch (error) {
    console.error("POST /api/quizzes/[id]/attempt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const { id } = await params
    const quizId = parseInt(id)

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, userId },
      include: {
        quiz: { select: { id: true, title: true, questions: true } },
      },
      orderBy: { submittedAt: "desc" },
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error("GET /api/quizzes/[id]/attempt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
