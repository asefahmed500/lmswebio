/**
 * Instructor Profile API
 * GET /api/instructors/[id] - Get instructor profile
 * PATCH /api/instructors/[id] - Update instructor profile
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const updateProfileSchema = z.object({
  bio: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  website: z.string().optional(),
  linkedInUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
})

/**
 * GET /api/instructors/[id]
 * Get instructor profile
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instructorId } = await params

    const profile = await prisma.instructorProfile.findUnique({
      where: { userId: instructorId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
          },
        },
      },
    })

    if (!profile) {
      // Return basic user info if profile doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: instructorId },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      })

      if (!user || user.role !== "INSTRUCTOR") {
        return NextResponse.json(
          { error: "Instructor not found" },
          { status: 404 }
        )
      }

      // Create basic profile
      const newProfile = await prisma.instructorProfile.create({
        data: {
          userId: instructorId,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
              role: true,
              createdAt: true,
            },
          },
        },
      })

      return NextResponse.json({ profile: newProfile })
    }

    // Get instructor's courses
    const courses = await prisma.course.findMany({
      where: {
        instructorId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        level: true,
        category: true,
        _count: {
          select: {
            enrolments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get reviews for instructor's courses
    const courseIds = courses.map((c) => c.id)
    const reviews = await prisma.courseReview.findMany({
      where: {
        courseId: { in: courseIds },
      },
      select: {
        rating: true,
        review: true,
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
        createdAt: true,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      profile: {
        ...profile,
        courses,
        reviews,
        totalCourses: courses.length,
        totalStudents: courses.reduce(
          (sum, c) => sum + (c._count.enrolments || 0),
          0
        ),
      },
    })
  } catch (error) {
    console.error("Instructor profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch instructor profile" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/instructors/[id]
 * Update instructor profile
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

    const { id: instructorId } = await params
    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if user is the instructor or admin
    const isInstructor = session.user.id === instructorId
    const isAdmin = session.user.role === "ADMIN"

    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this profile" },
        { status: 403 }
      )
    }

    // Get or create profile
    let profile = await prisma.instructorProfile.findUnique({
      where: { userId: instructorId },
    })

    if (!profile) {
      profile = await prisma.instructorProfile.create({
        data: {
          userId: instructorId,
          ...validatedData,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      })
    } else {
      profile = await prisma.instructorProfile.update({
        where: { userId: instructorId },
        data: validatedData,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Instructor profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update instructor profile" },
      { status: 500 }
    )
  }
}
