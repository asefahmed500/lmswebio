/**
 * Comments API endpoints
 * GET /api/comments - List comments
 * POST /api/comments - Create a new comment
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { sanitizeHtml } from "@/lib/sanitize"
import { z } from "zod"

// Validation schema
const createCommentSchema = z.object({
  discussionId: z.string().min(1),
  content: z.string().min(1).max(10000),
  parentId: z.string().min(1).optional(),
})

/**
 * GET /api/comments
 * List comments for a discussion with pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const discussionId = searchParams.get("discussionId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!discussionId) {
      return NextResponse.json(
        { error: "discussionId is required" },
        { status: 400 }
      )
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      )
    }

    const skip = (page - 1) * limit

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { discussionId: discussionId, parentId: null },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
            },
          },
          _count: {
            select: { replies: true },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: { discussionId: discussionId, parentId: null },
      }),
    ])

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Comment fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/comments
 * Create a new comment or reply
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const validatedData = createCommentSchema.parse(body)

    // Verify discussion exists and user is enrolled
    const discussion = await prisma.discussion.findUnique({
      where: { id: validatedData.discussionId },
      include: {
        course: true,
      },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      )
    }

    const enrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: discussion.courseId,
        },
      },
    })

    if (!enrollment && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You must be enrolled in this course to comment" },
        { status: 403 }
      )
    }

    // If it's a reply, verify parent comment exists
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
      })

      if (
        !parentComment ||
        parentComment.discussionId !== validatedData.discussionId
      ) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeHtml(validatedData.content)

    const comment = await prisma.comment.create({
      data: {
        discussionId: validatedData.discussionId,
        userId: session.user.id,
        content: sanitizedContent,
        parentId: validatedData.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Comment creation error:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
