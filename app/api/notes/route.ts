/**
 * Notes API endpoints
 * GET /api/notes - List user's notes
 * POST /api/notes - Create a new note
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const createNoteSchema = z.object({
  lessonId: z.number(),
  content: z.string().min(1),
  timestamp: z.number().optional(),
  isPrivate: z.boolean().default(true),
})

/**
 * GET /api/notes
 * List user's notes with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("lessonId")
    const courseId = searchParams.get("courseId")

    const where: any = { userId: session.user.id }

    if (lessonId) {
      where.lessonId = parseInt(lessonId)
    }

    if (courseId) {
      // Filter by course through lesson's module
      where.lesson = {
        module: {
          courseId: parseInt(courseId),
        },
      }
    }

    const notes = await prisma.note.findMany({
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
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error("Notes fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createNoteSchema.parse(body)

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: validatedData.lessonId },
      include: {
        module: true,
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Check if user is enrolled in the course
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
        { error: "You must be enrolled in this course to take notes" },
        { status: 403 }
      )
    }

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        lessonId: validatedData.lessonId,
        content: validatedData.content,
        timestamp: validatedData.timestamp,
        isPrivate: validatedData.isPrivate,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Note creation error:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
