import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { ApiErrors, handleUnknownError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return ApiErrors.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"

    if (!query || query.length < 2) {
      return ApiErrors.badRequest("Query must be at least 2 characters")
    }

    const results: {
      courses?: Record<string, unknown>[]
      users?: Record<string, unknown>[]
    } = {}

    if (type === "courses" || type === "all") {
      const courses = await prisma.course.findMany({
        where: {
          AND: [
            session.user.role === "STUDENT"
              ? { isPublished: true }
              : session.user.role === "INSTRUCTOR"
                ? { instructorId: session.user.id }
                : {},
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
                { tags: { hasSome: [query] } },
              ],
            },
          ],
        },
        include: {
          instructor: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          _count: {
            select: {
              modules: true,
              enrolments: true,
            },
          },
        },
        take: 10,
      })

      results.courses = courses
    }

    if ((type === "users" || type === "all") && session.user.role === "ADMIN") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { fullName: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
        },
        take: 10,
      })

      results.users = users
    }

    return NextResponse.json({ results, query })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
