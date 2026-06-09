import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"
import { z } from "zod"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"

const submitAssignmentSchema = z
  .object({
    fileUrl: z.string().url("Invalid file URL").optional(),
    textAnswer: z
      .string()
      .max(10000, "Text answer must be less than 10,000 characters")
      .optional(),
  })
  .refine((data) => data.fileUrl || data.textAnswer, {
    message: "Either fileUrl or textAnswer must be provided",
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
        { error: "Only students can submit assignments" },
        { status: 403 }
      )
    }

    const identifier = `${getRateLimitIdentifier(request)}:assignment-submit`
    const rl = await rateLimit(identifier, {
      maxRequests: 10,
      windowMs: 60_000,
    })
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id: assignmentId } = await params

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    // Check enrollment
    const isEnrolled = await prisma.enrolment.findUnique({
      where: { userId_courseId: { userId, courseId: assignment.courseId } },
    })

    if (!isEnrolled) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to submit assignments" },
        { status: 403 }
      )
    }

    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId, userId },
    })

    if (existing) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 })
    }

    const body = await request.json()
    const parsed = submitAssignmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        fileUrl: parsed.data.fileUrl ?? null,
        textAnswer: parsed.data.textAnswer ?? null,
      },
      include: {
        assignment: { select: { id: true, title: true } },
        user: { select: { id: true, fullName: true } },
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error("POST /api/assignments/[id]/submit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
