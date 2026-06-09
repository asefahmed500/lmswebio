/**
 * Discussion details API
 * GET /api/discussions/[id] - Get discussion with comments
 * PATCH /api/discussions/[id] - Update discussion (author only)
 * DELETE /api/discussions/[id] - Delete discussion (author/admin)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const updateDiscussionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
  isResolved: z.boolean().optional(),
})

/**
 * GET /api/discussions/[id]
 * Get discussion with all comments
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: discussionId } = await params

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
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
        comments: {
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
          where: {
            parentId: null,
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      )
    }

    // Get user votes
    const userVotes = await prisma.discussionVote.findMany({
      where: {
        discussionId,
        userId: session.user.id,
      },
    })

    const userVoteMap = new Map(userVotes.map((v) => [v.discussionId, v.value]))

    return NextResponse.json({
      ...discussion,
      userVote: userVoteMap.get(discussion.id) || 0,
    })
  } catch (error) {
    console.error("Discussion fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch discussion" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/discussions/[id]
 * Update discussion
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: discussionId } = await params
    const body = await req.json()
    const validatedData = updateDiscussionSchema.parse(body)

    // Check ownership or admin
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      )
    }

    const isAdmin = session.user.role === "ADMIN"
    const isAuthor = discussion.userId === session.user.id
    const isInstructor = session.user.role === "INSTRUCTOR"

    // Only admins/instructors can pin/unpin
    if (validatedData.isPinned !== undefined && !isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: "Only admins and instructors can pin discussions" },
        { status: 403 }
      )
    }

    // Only author or admin can update other fields
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this discussion" },
        { status: 403 }
      )
    }

    const updatedDiscussion = await prisma.discussion.update({
      where: { id: discussionId },
      data: validatedData,
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
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    })

    return NextResponse.json({ discussion: updatedDiscussion })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Discussion update error:", error)
    return NextResponse.json(
      { error: "Failed to update discussion" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/discussions/[id]
 * Delete discussion
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: discussionId } = await params

    // Check ownership or admin
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      )
    }

    const isAdmin = session.user.role === "ADMIN"
    const isAuthor = discussion.userId === session.user.id

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this discussion" },
        { status: 403 }
      )
    }

    await prisma.discussion.delete({
      where: { id: discussionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Discussion deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete discussion" },
      { status: 500 }
    )
  }
}
