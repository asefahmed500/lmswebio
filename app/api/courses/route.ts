import { NextRequest, NextResponse } from "next/server"
import type { Prisma, Level } from "@prisma/client"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"

const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  thumbnail: z.string().url().optional(),
})

const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().url().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 20
    const category = searchParams.get("category")
    const level = searchParams.get("level")
    const search = searchParams.get("search")
    const instructorId = searchParams.get("instructorId")

    const where: Prisma.CourseWhereInput = {}

    if (session.user.role === "INSTRUCTOR") {
      where.instructorId = session.user.id
    } else if (session.user.role === "STUDENT") {
      where.isPublished = true
    }

    if (category) where.category = category
    if (level) where.level = level as Level
    // Only allow instructorId filter for ADMIN (prevents IDOR)
    if (instructorId && session.user.role !== "INSTRUCTOR")
      where.instructorId = instructorId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
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
      prisma.course.count({ where }),
    ])

    return NextResponse.json({
      courses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Get courses error:", error)
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

    const identifier = `${getRateLimitIdentifier(request)}:courses-create`
    const rl = await rateLimit(identifier, {
      maxRequests: 30,
      windowMs: 60_000,
    })
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const data = createCourseSchema.parse(body)

    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: "Course with this title already exists" },
        { status: 409 }
      )
    }

    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        level: data.level,
        category: data.category,
        tags: data.tags,
        thumbnail: data.thumbnail,
        instructorId: session.user.id,
      },
      include: {
        instructor: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create course error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
