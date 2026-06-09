import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

/**
 * GET /api/payments - List payment history
 * Admin can see all payments. Students see their own.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Record<string, unknown> = {}

    // Students can only see their own payments
    if (session.user.role === "STUDENT") {
      where.userId = session.user.id
    } else if (
      userId &&
      (session.user.role === "ADMIN" || session.user.role === "ADMINISTRATOR")
    ) {
      where.userId = userId
    }

    if (status) {
      where.status = status
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("GET /api/payments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
