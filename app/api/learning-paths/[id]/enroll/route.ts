/**
 * Learning Path Enrollment API
 * POST /api/learning-paths/[id]/enroll - Enroll in a learning path
 * GET /api/learning-paths/[id]/enroll - Get enrollment status
 * DELETE /api/learning-paths/[id]/enroll - Unenroll from a learning path
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/learning-paths/[id]/enroll
 * Get enrollment status for a learning path
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

    const { id: learningPathId } = await params

    const enrollment = await prisma.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId: session.user.id,
          learningPathId,
        },
      },
      include: {
        learningPath: {
          include: {
            courses: {
              include: {
                course: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ enrolled: false })
    }

    return NextResponse.json({
      enrolled: true,
      enrollment,
    })
  } catch (error) {
    console.error("Learning path enrollment fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch enrollment status" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/learning-paths/[id]/enroll
 * Enroll in a learning path
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: learningPathId } = await params

    // Verify learning path exists and is published
    const learningPath = await prisma.learningPath.findUnique({
      where: { id: learningPathId },
      include: {
        courses: {
          include: {
            course: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!learningPath) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      )
    }

    if (!learningPath.isPublished) {
      return NextResponse.json(
        { error: "Learning path is not available for enrollment" },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId: session.user.id,
          learningPathId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this learning path" },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.learningPathEnrollment.create({
      data: {
        userId: session.user.id,
        learningPathId,
      },
      include: {
        learningPath: {
          include: {
            courses: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    console.error("Learning path enrollment error:", error)
    return NextResponse.json(
      { error: "Failed to enroll in learning path" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/learning-paths/[id]/enroll
 * Unenroll from a learning path
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

    const { id: learningPathId } = await params

    // Check if enrolled
    const enrollment = await prisma.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId: session.user.id,
          learningPathId,
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this learning path" },
        { status: 404 }
      )
    }

    await prisma.learningPathEnrollment.delete({
      where: {
        userId_learningPathId: {
          userId: session.user.id,
          learningPathId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Learning path unenrollment error:", error)
    return NextResponse.json(
      { error: "Failed to unenroll from learning path" },
      { status: 500 }
    )
  }
}
