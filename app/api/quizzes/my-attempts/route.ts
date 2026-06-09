import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user
    if (role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can view quiz attempts" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const quizId = searchParams.get("quizId")

    const where: Prisma.QuizAttemptWhereInput = { userId }
    if (quizId) {
      where.quizId = quizId
    }

    const attempts = await prisma.quizAttempt.findMany({
      where,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
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
    console.error("GET /api/quizzes/my-attempts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
