import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { createSubmissionSchema } from "@/lib/validators/submissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("assignmentId")

    if (session.user.role === "STUDENT") {
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          userId: session.user.id,
          ...(assignmentId && { assignmentId: Number(assignmentId) }),
        },
        include: {
          assignment: {
            select: { id: true, title: true, maxPoints: true, dueDate: true },
          },
        },
        orderBy: { submittedAt: "desc" },
      })

      return NextResponse.json({ submissions })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: Number(assignmentId) },
      include: { course: true },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      assignment.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: Number(assignmentId) },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        assignment: {
          select: { id: true, title: true, maxPoints: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Get submissions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createSubmissionSchema.parse(body)

    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    const enrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: assignment.courseId,
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      )
    }

    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: data.assignmentId,
        userId: session.user.id,
      },
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Already submitted this assignment" },
        { status: 409 }
      )
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: data.assignmentId,
        userId: session.user.id,
        textAnswer: data.textAnswer,
        fileUrl: data.fileUrl,
      },
      include: {
        assignment: {
          select: { id: true, title: true, maxPoints: true },
        },
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
