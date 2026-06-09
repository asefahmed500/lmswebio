import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBookmarkSchema = z.object({
  lessonId: z.string(),
  timestamp: z.number().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("lessonId")
    const courseId = searchParams.get("courseId")

    const where: Prisma.BookmarkWhereInput = { userId: session.user.id }

    if (lessonId) {
      where.lessonId = lessonId
    }

    if (courseId) {
      where.lesson = {
        module: {
          courseId: courseId,
        },
      }
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                courseId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error("Bookmarks fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createBookmarkSchema.parse(body)

    const lesson = await prisma.lesson.findUnique({
      where: { id: validatedData.lessonId },
      include: { module: true },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const enrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.module.courseId,
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to bookmark lessons" },
        { status: 403 }
      )
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: validatedData.lessonId,
        },
      },
    })

    if (existingBookmark) {
      return NextResponse.json(
        { error: "Bookmark already exists" },
        { status: 400 }
      )
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        lessonId: validatedData.lessonId,
        timestamp: validatedData.timestamp,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: { select: { id: true, title: true } },
          },
        },
      },
    })

    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Bookmark creation error:", error)
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bookmarkId = searchParams.get("id") || ""

    if (!bookmarkId) {
      return NextResponse.json(
        { error: "Bookmark ID required" },
        { status: 400 }
      )
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    })

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 })
    }

    if (bookmark.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this bookmark" },
        { status: 403 }
      )
    }

    await prisma.bookmark.delete({
      where: { id: bookmarkId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Bookmark deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    )
  }
}
