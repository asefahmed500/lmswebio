/**
 * Discussion vote API
 * POST /api/discussions/[id]/vote - Vote on a discussion
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const voteSchema = z.object({
  value: z.number().refine((v) => v === 1 || v === -1 || v === 0, {
    message: "Vote must be 1 (upvote), -1 (downvote), or 0 (remove vote)",
  }),
})

/**
 * POST /api/discussions/[id]/vote
 * Vote on a discussion
 */
export async function POST(
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
    const { value } = voteSchema.parse(body)

    // Verify discussion exists
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    })

    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      )
    }

    // Check if user is enrolled in the course
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
        { error: "You must be enrolled in this course to vote" },
        { status: 403 }
      )
    }

    // Check for existing vote
    const existingVote = await prisma.discussionVote.findUnique({
      where: {
        discussionId_userId: {
          discussionId,
          userId: session.user.id,
        },
      },
    })

    if (existingVote) {
      if (value === 0) {
        // Remove vote
        await prisma.discussionVote.delete({
          where: {
            discussionId_userId: {
              discussionId,
              userId: session.user.id,
            },
          },
        })
      } else {
        // Update vote
        await prisma.discussionVote.update({
          where: {
            discussionId_userId: {
              discussionId,
              userId: session.user.id,
            },
          },
          data: { value },
        })
      }
    } else if (value !== 0) {
      // Create new vote
      await prisma.discussionVote.create({
        data: {
          discussionId,
          userId: session.user.id,
          value,
        },
      })
    }

    // Get updated vote count
    const { _sum } = await prisma.discussionVote.aggregate({
      _sum: { value: true },
      where: { discussionId },
    })

    const voteCount = _sum.value ?? 0

    return NextResponse.json({
      success: true,
      voteCount,
      userVote: value,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Discussion vote error:", error)
    return NextResponse.json(
      { error: "Failed to vote on discussion" },
      { status: 500 }
    )
  }
}
