import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createAssignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  maxPoints: z.number(),
  courseId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    const where: Prisma.AssignmentWhereInput = {}

    if (session.user.role === "INSTRUCTOR") {
      const courses = await prisma.course.findMany({
        where: { instructorId: session.user.id },
        select: { id: true },
      })
      const allowedIds = courses.map((c) => c.id)
      if (courseId) {
        const cid = courseId
        if (!allowedIds.includes(cid)) {
          return NextResponse.json({ assignments: [] })
        }
        where.courseId = cid
      } else {
        where.courseId = { in: allowedIds }
      }
    } else if (session.user.role === "STUDENT") {
      const enrollments = await prisma.enrolment.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        select: { courseId: true },
      })
      const allowedIds = enrollments.map((e) => e.courseId)
      if (courseId) {
        const cid = courseId
        if (!allowedIds.includes(cid)) {
          return NextResponse.json({ assignments: [] })
        }
        where.courseId = cid
      } else {
        where.courseId = { in: allowedIds }
      }
    } else if (courseId) {
      where.courseId = courseId
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("Get assignments error:", error)
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
    const data = createAssignmentSchema.parse(body)

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

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        maxPoints: data.maxPoints,
        courseId: data.courseId,
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
