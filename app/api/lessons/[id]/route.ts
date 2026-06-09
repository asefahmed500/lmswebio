import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  contentType: z.enum(["text", "video", "pdf"]).optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const lesson = await prisma.lesson.findUnique({
      where: { id: id },
      include: {
        module: {
          include: { course: true },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      lesson.module.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateLessonSchema.parse(body)

    const updatedLesson = await prisma.lesson.update({
      where: { id: id },
      data,
    })

    return NextResponse.json({ lesson: updatedLesson })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update lesson error:", error)
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

    const { id } = await params
    const lesson = await prisma.lesson.findUnique({
      where: { id: id },
      include: {
        module: {
          include: { course: true },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      lesson.module.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.lesson.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete lesson error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
