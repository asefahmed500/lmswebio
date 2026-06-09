/**
 * User Badges API endpoints
 * GET /api/user-badges - Get user's earned badges
 * POST /api/user-badges - Award a badge to user (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const awardBadgeSchema = z.object({
  userId: z.string(),
  badgeId: z.string(),
})

/**
 * GET /api/user-badges
 * Get user's earned badges
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const targetUserId = userId || session.user.id

    // Users can only view their own badges unless they're admins
    if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId: targetUserId,
      },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
    })

    return NextResponse.json({ userBadges })
  } catch (error) {
    console.error("User badges fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user badges" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user-badges
 * Award a badge to a user (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = awardBadgeSchema.parse(body)

    // Check if badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: validatedData.badgeId },
    })

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    // Check if user already has this badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: validatedData.userId,
          badgeId: validatedData.badgeId,
        },
      },
    })

    if (existingUserBadge) {
      return NextResponse.json(
        { error: "User already has this badge" },
        { status: 400 }
      )
    }

    const userBadge = await prisma.userBadge.create({
      data: {
        userId: validatedData.userId,
        badgeId: validatedData.badgeId,
      },
      include: {
        badge: true,
      },
    })

    return NextResponse.json({ userBadge }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Badge awarding error:", error)
    return NextResponse.json(
      { error: "Failed to award badge" },
      { status: 500 }
    )
  }
}
