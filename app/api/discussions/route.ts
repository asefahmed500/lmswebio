/**
 * Discussions API endpoints
 * GET /api/discussions - List discussions
 * POST /api/discussions - Create a new discussion
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { sanitizeHtml, stripHtml } from "@/lib/sanitize"
import { z } from "zod"

// Validation schema
const createDiscussionSchema = z.object({
  courseId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
})

/**
 * GET /api/discussions
 * List discussions with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    const where: any = {}
    if (courseId) {
      where.courseId = parseInt(courseId)
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    const [discussions, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
        orderBy: [
          { isPinned: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.discussion.count({ where }),
    ])

    // Get user votes if authenticated
    const discussionIds = discussions.map((d) => d.id)
    const userVotes = session.user.id
      ? await prisma.discussionVote.findMany({
          where: {
            discussionId: { in: discussionIds },
            userId: session.user.id,
          },
        })
      : []

    const userVoteMap = new Map(
      userVotes.map((v) => [v.discussionId, v.value])
    )

    const discussionsWithVotes = discussions.map((discussion) => ({
      ...discussion,
      userVote: userVoteMap.get(discussion.id) || 0,
    }))

    return NextResponse.json({
      discussions: discussionsWithVotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Discussions fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch discussions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/discussions
 * Create a new discussion
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const validatedData = createDiscussionSchema.parse(body)

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: validatedData.courseId,
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to participate" },
        { status: 403 }
      )
    }

    // Sanitize title and content to prevent XSS
    const sanitizedTitle = stripHtml(validatedData.title)
    const sanitizedContent = sanitizeHtml(validatedData.content)

    const discussion = await prisma.discussion.create({
      data: {
        courseId: validatedData.courseId,
        userId: session.user.id,
        title: sanitizedTitle,
        content: sanitizedContent,
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
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    })

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Discussion creation error:", error)
    return NextResponse.json(
      { error: "Failed to create discussion" },
      { status: 500 }
    )
  }
}
