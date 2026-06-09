import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
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

    const where: Prisma.AnnouncementWhereInput = {}
    if (courseId) {
      where.courseId = courseId
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ announcements: announcements || [] })
  } catch (error) {
    console.error("Get announcements error:", error)
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
    const data = createAnnouncementSchema.parse(body)

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

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        courseId: data.courseId,
      },
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create announcement error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
