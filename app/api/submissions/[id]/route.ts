import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const gradeSubmissionSchema = z.object({
  grade: z.number(),
  feedback: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: Number((await params).id) },
      include: {
        assignment: {
          include: {
            course: {
              select: { id: true, title: true, instructorId: true },
            },
          },
        },
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.id !== submission.userId &&
      submission.assignment.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("Get submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: Number((await params).id) },
      include: {
        assignment: {
          include: { course: true },
        },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      submission.assignment.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = gradeSubmissionSchema.parse(body)

    const gradedSubmission = await prisma.assignmentSubmission.update({
      where: { id: Number((await params).id) },
      data: {
        grade: data.grade,
        feedback: data.feedback,
        gradedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        assignment: {
          select: { id: true, title: true, maxPoints: true },
        },
      },
    })

    return NextResponse.json({ submission: gradedSubmission })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Grade submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
