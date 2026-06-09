import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createModuleSchema = z.object({
  title: z.string().min(1),
  courseId: z.string(),
  order: z.number(),
})

const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.number().optional(),
})

const reorderModulesSchema = z.object({
  modules: z.array(
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
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (
      session.user.role === "STUDENT" &&
      !course.isPublished &&
      course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const modules = await prisma.module.findMany({
      where: { courseId: courseId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error("Get modules error:", error)
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
    const data = createModuleSchema.parse(body)

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (
      session.user.role === "INSTRUCTOR" &&
      course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const mod = await prisma.module.create({
      data: {
        title: data.title,
        courseId: data.courseId,
        order: data.order,
      },
      include: {
        lessons: true,
      },
    })

    return NextResponse.json({ module: mod }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create module error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = reorderModulesSchema.parse(body)

    // Verify ownership for all modules being reordered
    for (const mod of data.modules) {
      const existingModule = await prisma.module.findUnique({
        where: { id: mod.id },
        include: { course: { select: { instructorId: true } } },
      })

      if (!existingModule) {
        return NextResponse.json(
          { error: `Module ${mod.id} not found` },
          { status: 404 }
        )
      }

      if (
        session.user.role === "INSTRUCTOR" &&
        existingModule.course.instructorId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    for (const mod of data.modules) {
      await prisma.module.update({
        where: { id: mod.id },
        data: { order: mod.order },
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
    console.error("Reorder modules error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
