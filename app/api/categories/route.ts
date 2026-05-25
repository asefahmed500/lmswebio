import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const courses = await prisma.course.findMany({
      where: {
        category: { not: null },
        ...(search ? { category: { contains: search, mode: "insensitive" } } : {}),
      },
      select: { category: true },
    })

    // Count courses per category
    const categoryMap = new Map<string, number>()
    courses.forEach((c) => {
      if (c.category) {
        categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + 1)
      }
    })

    const categories = Array.from(categoryMap.entries())
      .map(([name, course_count]) => ({ name, course_count }))
      .sort((a, b) => b.course_count - a.course_count)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createCategorySchema.parse(body)

    // Categories are derived from Course.category field - just return success
    // The category becomes available when a course uses it
    return NextResponse.json(
      { category: { name: data.name, description: data.description } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
