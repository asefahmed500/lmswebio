import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  maxPoints: z.number().optional(),
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: (await params).id },
      include: {
        course: {
          select: { id: true, title: true, instructorId: true },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    const isInstructor =
      session.user.role === "ADMIN" ||
      assignment.course.instructorId === session.user.id

    if (!isInstructor) {
      const enrollment = await prisma.enrolment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: assignment.courseId,
          },
        },
      })

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error("Get assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: (await params).id },
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

    const body = await request.json()
    const data = updateAssignmentSchema.parse(body)

    const updatedAssignment = await prisma.assignment.update({
      where: { id: (await params).id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })

    return NextResponse.json({ assignment: updatedAssignment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update assignment error:", error)
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: (await params).id },
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

    await prisma.assignment.delete({
      where: { id: (await params).id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
