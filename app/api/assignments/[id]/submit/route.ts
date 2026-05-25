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
      return NextResponse.json({ error: "Only students can submit assignments" }, { status: 403 })
    }

    const { id } = await params
    const assignmentId = parseInt(id)

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId },
    })

    if (existing) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 })
    }

    const body = await request.json()
    const { fileUrl, textAnswer } = body

    if (!fileUrl && !textAnswer) {
      return NextResponse.json({ error: "Provide fileUrl or textAnswer" }, { status: 400 })
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        fileUrl: fileUrl ?? null,
        textAnswer: textAnswer ?? null,
      },
      include: {
        assignment: { select: { id: true, title: true } },
        user: { select: { id: true, fullName: true } },
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error("POST /api/assignments/[id]/submit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
