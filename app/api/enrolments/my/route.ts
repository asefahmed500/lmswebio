import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user
    if (role !== "STUDENT") {
      return NextResponse.json({ error: "Only students have enrollments" }, { status: 403 })
    }

    const enrolments = await prisma.enrolment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, thumbnail: true, level: true,
            instructor: { select: { id: true, fullName: true } },
            modules: {
              select: { _count: { select: { lessons: true } } },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })

    return NextResponse.json(enrolments)
  } catch (error) {
    console.error("GET /api/enrolments/my error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
