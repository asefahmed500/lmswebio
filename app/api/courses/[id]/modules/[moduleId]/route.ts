import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user
    if (role !== "INSTRUCTOR" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, moduleId } = await params
    const courseId = parseInt(id)
    const modId = parseInt(moduleId)

    const module = await prisma.module.findUnique({
      where: { id: modId },
      include: { course: true },
    })

    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    if (role === "INSTRUCTOR" && module.course.instructorId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.order !== undefined) data.order = body.order
    if (body.lessons !== undefined) {
      await prisma.lesson.deleteMany({ where: { moduleId: modId } })
      const lessons = body.lessons as Array<{ title: string; content?: string; contentType?: string; order: number; duration?: number }>
      for (let i = 0; i < lessons.length; i++) {
        await prisma.lesson.create({
          data: {
            title: lessons[i].title,
            content: lessons[i].content ?? "",
            contentType: lessons[i].contentType ?? "text",
            order: lessons[i].order ?? i,
            duration: lessons[i].duration ?? null,
            moduleId: modId,
          },
        })
      }
    } else {
      await prisma.module.update({ where: { id: modId }, data })
    }

    const updated = await prisma.module.findUnique({
      where: { id: modId },
      include: { lessons: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PUT /api/courses/[id]/modules/[moduleId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user
    if (role !== "INSTRUCTOR" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, moduleId } = await params
    const courseId = parseInt(id)
    const modId = parseInt(moduleId)

    const module = await prisma.module.findUnique({
      where: { id: modId },
      include: { course: true },
    })

    if (!module || module.courseId !== courseId) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    if (role === "INSTRUCTOR" && module.course.instructorId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await prisma.module.delete({ where: { id: modId } })

    const remaining = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    })

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i) {
        await prisma.module.update({ where: { id: remaining[i].id }, data: { order: i } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/courses/[id]/modules/[moduleId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
