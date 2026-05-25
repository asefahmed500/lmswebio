/**
 * Review helpful vote API
 * POST /api/reviews/[id]/helpful - Mark review as helpful (one vote per user)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const reviewId = parseInt(id)

    // Verify review exists
    const review = await prisma.courseReview.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // User can't mark their own review as helpful
    if (review.userId === session.user.id) {
      return NextResponse.json(
        { error: "You can't mark your own review as helpful" },
        { status: 400 }
      )
    }

    // Check if user already voted — prevent duplicate votes
    const existingVote = await prisma.reviewHelpfulVote?.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id,
        },
      },
    })

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this review" },
        { status: 400 }
      )
    }

    // Create vote record and increment count in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Try to create the vote record
      await tx.reviewHelpfulVote.create({
        data: {
          reviewId,
          userId: session.user.id,
        },
      })

      // Increment the counter
      return tx.courseReview.update({
        where: { id: reviewId },
        data: {
          helpfulVotes: { increment: 1 },
        },
      })
    })

    return NextResponse.json({
      success: true,
      helpfulVotes: result.helpfulVotes,
    })
  } catch (error) {
    console.error("Review helpful vote error:", error)
    return NextResponse.json(
      { error: "Failed to mark review as helpful" },
      { status: 500 }
    )
  }
}
