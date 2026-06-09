import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { canAccessCourse, canModifyCourse } from "@/lib/authorization"
import { z } from "zod"
import { Role } from "@prisma/client"

const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().url().optional(),
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

    const { id } = await params

    const hasAccess = await canAccessCourse(
      session.user.id,
      id,
      session.user.role as Role
    )
    if (!hasAccess) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error("Get course error:", error)
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user can modify this course (prevents IDOR)
    const canModify = await canModifyCourse(
      session.user.id,
      id,
      session.user.role as Role
    )
    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateCourseSchema.parse(body)

    const updatedCourse = await prisma.course.update({
      where: { id },
      data,
      include: {
        instructor: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Update course error:", error)
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
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    await prisma.course.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete course error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user can modify this course (prevents IDOR)
    const canModify = await canModifyCourse(
      session.user.id,
      id,
      session.user.role as Role
    )
    if (!canModify) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { isPublished } = body

    if (typeof isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished must be a boolean" },
        { status: 400 }
      )
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { isPublished },
      include: {
        instructor: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error("Patch course error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
