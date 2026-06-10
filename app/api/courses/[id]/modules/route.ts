import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: courseId } = await params

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (role === "INSTRUCTOR" && course.instructorId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const maxOrder = await prisma.module.aggregate({
      where: { courseId },
      _max: { order: true },
    })

    const mod = await prisma.module.create({
      data: {
        title,
        order: (maxOrder._max.order ?? -1) + 1,
        courseId,
      },
      include: { lessons: true },
    })

    return NextResponse.json(mod, { status: 201 })
  } catch (error) {
    console.error("POST /api/courses/[id]/modules error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isPublished: true, instructorId: true },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (session.user.role === "STUDENT" && !course.isPublished) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.user.role === "STUDENT") {
      const enrollment = await prisma.enrolment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId,
          },
        },
      })
      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error("GET /api/courses/[id]/modules error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
