import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

const updateModuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  order: z.number().int().nonnegative().optional(),
  lessons: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1).max(200),
        content: z.string().optional(),
        contentType: z.string().max(50).optional(),
        order: z.number().int().nonnegative().optional(),
        duration: z.number().int().nonnegative().nullable().optional(),
      })
    )
    .max(200)
    .optional(),
})

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

    const parsed = updateModuleSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }
    const { lessons, ...moduleData } = parsed.data

    await prisma.$transaction(async (tx) => {
      if (Object.keys(moduleData).length > 0) {
        await tx.module.update({ where: { id: modId }, data: moduleData })
      }

      if (lessons) {
        // Upsert lessons instead of delete-and-recreate: recreating them
        // breaks LessonCompletion foreign keys and destroys student progress.
        for (const [index, lesson] of lessons.entries()) {
          const values = {
            title: lesson.title,
            content: lesson.content ?? "",
            contentType: lesson.contentType ?? "text",
            order: lesson.order ?? index,
            duration: lesson.duration ?? null,
          }

          if (lesson.id) {
            const existing = await tx.lesson.findFirst({
              where: { id: lesson.id, moduleId: modId },
              select: { id: true },
            })
            if (existing) {
              await tx.lesson.update({
                where: { id: existing.id },
                data: values,
              })
              continue
            }
          }

          await tx.lesson.create({ data: { ...values, moduleId: modId } })
        }
      }
    })

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
