/**
 * Note details API
 * GET /api/notes/[id] - Get note details
 * PATCH /api/notes/[id] - Update note
 * DELETE /api/notes/[id] - Delete note
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  timestamp: z.number().optional(),
  isPrivate: z.boolean().optional(),
})

/**
 * GET /api/notes/[id]
 * Get note details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const noteId = parseInt(id)

    const note = await prisma.note.findUnique({
      where: { id: noteId },
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
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Check if user owns the note or it's public
    if (note.userId !== session.user.id && note.isPrivate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error("Note fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notes/[id]
 * Update note
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const noteId = parseInt(id)
    const body = await req.json()
    const validatedData = updateNoteSchema.parse(body)

    // Check ownership
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    if (note.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this note" },
        { status: 403 }
      )
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: validatedData,
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

    return NextResponse.json({ note: updatedNote })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Note update error:", error)
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete note
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const noteId = parseInt(id)

    // Check ownership
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    if (note.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this note" },
        { status: 403 }
      )
    }

    await prisma.note.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Note deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}
