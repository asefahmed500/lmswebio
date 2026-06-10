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

    const { id: courseId, moduleId: modId } = await params

    const mod = await prisma.module.findUnique({
      where: { id: modId },
      include: { course: true },
    })

    if (!mod || mod.courseId !== courseId) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    if (role === "INSTRUCTOR" && mod.course.instructorId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.order !== undefined) data.order = body.order
    if (body.lessons !== undefined) {
      await prisma.$transaction(async (tx) => {
        await tx.lesson.deleteMany({ where: { moduleId: modId } })
        const lessons = body.lessons as Array<{
          title: string
          content?: string
          contentType?: string
          order: number
          duration?: number
        }>
        await tx.lesson.createMany({
          data: lessons.map((l, i) => ({
            title: l.title,
            content: l.content ?? "",
            contentType: l.contentType ?? "text",
            order: l.order ?? i,
            duration: l.duration ?? null,
            moduleId: modId,
          })),
        })
      })
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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

    const { id: courseId, moduleId: modId } = await params

    const mod = await prisma.module.findUnique({
      where: { id: modId },
      include: { course: true },
    })

    if (!mod || mod.courseId !== courseId) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    if (role === "INSTRUCTOR" && mod.course.instructorId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await prisma.module.delete({ where: { id: modId } })

    const remaining = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    })

    await Promise.all(
      remaining.map((m, i) =>
        m.order !== i
          ? prisma.module.update({ where: { id: m.id }, data: { order: i } })
          : Promise.resolve()
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/courses/[id]/modules/[moduleId] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
