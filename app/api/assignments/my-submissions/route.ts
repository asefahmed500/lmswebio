import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user
    if (role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can view submissions" },
        { status: 403 }
      )
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { userId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            maxPoints: true,
            courseId: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("GET /api/assignments/my-submissions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
