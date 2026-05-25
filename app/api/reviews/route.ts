/**
 * Course Reviews API endpoints
 * GET /api/reviews - List reviews
 * POST /api/reviews - Create a review
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const createReviewSchema = z.object({
  courseId: z.number(),
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
})

/**
 * GET /api/reviews
 * List reviews with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const userId = searchParams.get("userId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const sort = searchParams.get("sort") || "recent" // recent, helpful, rating

    const skip = (page - 1) * limit

    const where: any = {}
    if (courseId) {
      where.courseId = parseInt(courseId)
    }
    if (userId) {
      where.userId = parseInt(userId)
    }

    let orderBy: any = { createdAt: "desc" }
    if (sort === "helpful") {
      orderBy = { helpfulVotes: "desc" }
    } else if (sort === "rating") {
      orderBy = { rating: "desc" }
    }

    const [reviews, total] = await Promise.all([
      prisma.courseReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.courseReview.count({ where }),
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Reviews fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews
 * Create a new review
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createReviewSchema.parse(body)

    // Check if user has completed the course
    const enrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: validatedData.courseId,
        },
      },
    })

    if (!enrollment || enrollment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You must complete this course before reviewing it" },
        { status: 400 }
      )
    }

    // Check if review already exists
    const existingReview = await prisma.courseReview.findUnique({
      where: {
        courseId_userId: {
          courseId: validatedData.courseId,
          userId: session.user.id,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this course" },
        { status: 400 }
      )
    }

    const review = await prisma.courseReview.create({
      data: {
        courseId: validatedData.courseId,
        userId: session.user.id,
        rating: validatedData.rating,
        review: validatedData.review,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Review creation error:", error)
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}
