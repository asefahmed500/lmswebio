import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
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
    const parsedLimit = Number(searchParams.get("limit") ?? 50)
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50

    const where: Prisma.PaymentWhereInput = {}

    switch (session.user.role) {
      case "STUDENT":
        // Students only ever see their own payments.
        where.userId = session.user.id
        break
      case "INSTRUCTOR":
        // Instructors see payments for courses they teach, never all payments.
        where.course = { instructorId: session.user.id }
        break
      case "ADMIN":
        if (userId) where.userId = userId
        break
      default:
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
