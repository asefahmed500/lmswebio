/**
 * Learning Paths API endpoints
 * GET /api/learning-paths - List learning paths
 * POST /api/learning-paths - Create a learning path (admin/instructor)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const createLearningPathSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  estimatedDuration: z.number(),
  isPublished: z.boolean().default(false),
  courses: z.array(
    z.object({
      courseId: z.number(),
      order: z.number(),
      isMandatory: z.boolean().default(true),
    })
  ),
})

/**
 * GET /api/learning-paths
 * List learning paths
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const level = searchParams.get("level")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const myPaths = searchParams.get("myPaths") === "true"

    const session = await getSession()

    const skip = (page - 1) * limit

    const where: any = { isPublished: true }

    // Show unpublished paths only to admins/instructors
    if (!session || (session.user.role === "STUDENT" || !session)) {
      where.isPublished = true
    }

    if (level) {
      where.level = level
    }

    const [learningPaths, total] = await Promise.all([
      prisma.learningPath.findMany({
        where,
        include: {
          courses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  thumbnail: true,
                  level: true,
                  instructor: {
                    select: {
                      id: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
          _count: {
            select: {
              courses: true,
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.learningPath.count({ where }),
    ])

    // If user is logged in, get their enrollments
    let enrolledPathIds: number[] = []
    if (session && myPaths) {
      const userEnrollments = await prisma.learningPathEnrollment.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          learningPathId: true,
        },
      })
      enrolledPathIds = userEnrollments.map((e) => e.learningPathId)
    }

    const filteredPaths = myPaths
      ? learningPaths.filter((lp) => enrolledPathIds.includes(lp.id))
      : learningPaths

    return NextResponse.json({
      learningPaths: filteredPaths,
      pagination: {
        page,
        limit,
        total: myPaths ? enrolledPathIds.length : total,
        pages: Math.ceil((myPaths ? enrolledPathIds.length : total) / limit),
      },
    })
  } catch (error) {
    console.error("Learning paths fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch learning paths" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/learning-paths
 * Create a new learning path (admin/instructor)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createLearningPathSchema.parse(body)

    // Check if slug is unique
    const existingPath = await prisma.learningPath.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingPath) {
      return NextResponse.json(
        { error: "Learning path with this slug already exists" },
        { status: 400 }
      )
    }

    // Verify all courses exist
    const courseIds = validatedData.courses.map((c) => c.courseId)
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
      },
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: "One or more courses not found" },
        { status: 404 }
      )
    }

    // Create learning path with courses
    const learningPath = await prisma.learningPath.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        description: validatedData.description,
        thumbnail: validatedData.thumbnail,
        level: validatedData.level,
        estimatedDuration: validatedData.estimatedDuration,
        isPublished: validatedData.isPublished,
        courses: {
          create: validatedData.courses,
        },
      },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    return NextResponse.json({ learningPath }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Learning path creation error:", error)
    return NextResponse.json(
      { error: "Failed to create learning path" },
      { status: 500 }
    )
  }
}
