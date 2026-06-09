import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createTagSchema = z.object({
  name: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const courses = await prisma.course.findMany({
      where: search ? { tags: { has: search } } : undefined,
      select: { tags: true },
    })

    const allTags = new Set<string>()
    courses.forEach((course) => {
      course.tags.forEach((tag) => allTags.add(tag))
    })

    return NextResponse.json({
      tags: Array.from(allTags).sort(),
    })
  } catch (error) {
    console.error("Get tags error:", error)
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
    const data = createTagSchema.parse(body)

    // Tags are stored on Course model as string array - return success
    return NextResponse.json({ tag: { name: data.name } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
