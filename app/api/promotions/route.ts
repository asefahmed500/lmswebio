import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/** Active, time-valid promotions with their real course summaries. */
export async function GET() {
  try {
    const now = new Date()
    const active = await prisma.promotion.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            level: true,
            category: true,
            instructor: { select: { fullName: true } },
          },
        },
      },
    })

    // Apply the time window in JS. Prisma/MongoDB handling of missing DateTime
    // fields combined with nested OR/AND can silently drop valid offers.
    const promotions = active.filter((promotion) => {
      if (promotion.startsAt && promotion.startsAt > now) return false
      if (promotion.endsAt && promotion.endsAt < now) return false
      return true
    })

    return NextResponse.json({ promotions })
  } catch (error) {
    console.error("GET /api/promotions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
