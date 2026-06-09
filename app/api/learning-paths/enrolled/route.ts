import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = session.user

    const enrollments = await prisma.learningPathEnrollment.findMany({
      where: { userId },
      include: {
        learningPath: {
          include: {
            courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    level: true,
                    category: true,
                    instructor: {
                      select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: { order: "asc" },
            },
            _count: {
              select: {
                courses: true,
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("GET /api/learning-paths/enrolled error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
