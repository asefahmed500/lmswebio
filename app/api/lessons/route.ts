import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createLessonSchema = z.object({
  title: z.string().min(1),
  moduleId: z.string(),
  content: z.string().optional(),
  contentType: z.enum(["text", "video", "pdf"]).default("text"),
  duration: z.number().optional(),
  order: z.number(),
})

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  contentType: z.enum(["text", "video", "pdf"]).optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
})

const reorderLessonsSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get("moduleId")

    if (!moduleId) {
      return NextResponse.json({ error: "Module ID required" }, { status: 400 })
    }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    })

    if (!mod) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    if (
      session.user.role === "STUDENT" &&
      !mod.course.isPublished &&
      mod.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      mod.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: moduleId },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error("Get lessons error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createLessonSchema.parse(body)

    const mod = await prisma.module.findUnique({
      where: { id: data.moduleId },
      include: { course: true },
    })

    if (!mod) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      mod.course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        moduleId: data.moduleId,
        content: data.content,
        contentType: data.contentType,
        duration: data.duration,
        order: data.order,
      },
    })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create lesson error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = reorderLessonsSchema.parse(body)

    // Verify ownership for all lessons being reordered
    for (const les of data.lessons) {
      const existingLesson = await prisma.lesson.findUnique({
        where: { id: les.id },
        include: {
          module: {
            include: { course: { select: { instructorId: true } } },
          },
        },
      })

      if (!existingLesson) {
        return NextResponse.json(
          { error: `Lesson ${les.id} not found` },
          { status: 404 }
        )
      }

      if (
        session.user.role === "INSTRUCTOR" &&
        existingLesson.module.course.instructorId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    for (const lesson of data.lessons) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { order: lesson.order },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Reorder lessons error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
