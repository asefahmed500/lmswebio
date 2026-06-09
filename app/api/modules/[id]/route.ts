import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
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

    const mod = await prisma.module.findUnique({
      where: { id: (await params).id },
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

    const body = await request.json()
    const data = updateModuleSchema.parse(body)

    const updatedModule = await prisma.module.update({
      where: { id: (await params).id },
      data,
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({ module: updatedModule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update module error:", error)
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

    const mod = await prisma.module.findUnique({
      where: { id: (await params).id },
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

    await prisma.module.delete({
      where: { id: (await params).id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete module error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
