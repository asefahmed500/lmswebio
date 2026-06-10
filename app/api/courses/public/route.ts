import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 12
    const category = searchParams.get("category")
    const level = searchParams.get("level")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {
      isPublished: true,
    }

    if (category) where.category = category
    if (level) where.level = level
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        include: {
          instructor: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          _count: {
            select: {
              modules: true,
              enrolments: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.course.count({ where: where as any }),
    ])

    const [totalCourses, totalStudents, totalInstructors] = await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "INSTRUCTOR" } }),
    ])

    const stats = {
      totalCourses,
      totalStudents,
      totalInstructors,
    }

    return NextResponse.json({
      courses,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Public courses error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
