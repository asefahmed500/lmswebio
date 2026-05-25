/**
 * Badges API endpoints
 * GET /api/badges - List all badges
 * POST /api/badges - Create a badge (admin only)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const createBadgeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().min(1),
  iconUrl: z.string().optional(),
  criteria: z.any(),
  points: z.number().default(0),
})

/**
 * GET /api/badges
 * List all badges with user's earned status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const earned = searchParams.get("earned") // "true" to get only earned badges

    const where: any = {}
    if (category) {
      // Assuming criteria has a category field
      where.criteria = {
        path: ["category"],
        equals: category,
      }
    }

    const badges = await prisma.badge.findMany({
      where,
      orderBy: { points: "desc" },
    })

    // Get user's earned badges
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        badgeId: true,
        earnedAt: true,
      },
    })

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))

    const badgesWithStatus = badges.map((badge) => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earnedAt: earnedBadgeIds.has(badge.id)
        ? userBadges.find((ub) => ub.badgeId === badge.id)?.earnedAt
        : null,
    }))

    const filteredBadges =
      earned === "true"
        ? badgesWithStatus.filter((b) => b.earned)
        : badgesWithStatus

    return NextResponse.json({ badges: filteredBadges })
  } catch (error) {
    console.error("Badges fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
  }
}

/**
 * POST /api/badges
 * Create a new badge (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createBadgeSchema.parse(body)

    // Check if slug is unique
    const existingBadge = await prisma.badge.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingBadge) {
      return NextResponse.json(
        { error: "Badge with this slug already exists" },
        { status: 400 }
      )
    }

    const badge = await prisma.badge.create({
      data: validatedData,
    })

    return NextResponse.json({ badge }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Badge creation error:", error)
    return NextResponse.json(
      { error: "Failed to create badge" },
      { status: 500 }
    )
  }
}
