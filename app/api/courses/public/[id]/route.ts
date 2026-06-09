import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const courseInclude = {
  instructor: {
    select: { id: true, fullName: true, avatarUrl: true },
  },
  _count: {
    select: {
      modules: true,
      enrolments: true,
    },
  },
  modules: {
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          contentType: true,
          duration: true,
          order: true,
        },
      },
    },
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: param } = await params

    let course = null

    // Try by slug first (most common case for public URLs)
    course = await prisma.course.findUnique({
      where: { slug: param },
      include: courseInclude,
    })

    // If not found and param looks like ObjectId, try by id
    if (!course && /^[a-f\d]{24}$/i.test(param)) {
      course = await prisma.course.findUnique({
        where: { id: param },
        include: courseInclude,
      })
    }

    if (!course || !course.isPublished) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error("Public course detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
