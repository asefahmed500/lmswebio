/**
 * Certificates API endpoints
 * GET /api/certificates - List user certificates
 * POST /api/certificates - Generate certificate for completed course
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const generateCertificateSchema = z.object({
  courseId: z.number(),
})

/**
 * GET /api/certificates
 * List all certificates for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")

    const where: any = { userId: session.user.id }
    if (courseId) {
      where.courseId = parseInt(courseId)
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error("Certificates fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/certificates
 * Generate a certificate for a completed course
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = generateCertificateSchema.parse(body)

    // Check if user has completed the course
    const enrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: validatedData.courseId,
        },
      },
    })

    if (!enrollment || enrollment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Course must be completed to receive a certificate" },
        { status: 400 }
      )
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId: session.user.id,
        courseId: validatedData.courseId,
      },
    })

    if (existingCertificate) {
      return NextResponse.json(
        { error: "Certificate already exists" },
        { status: 400 }
      )
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      include: {
        instructor: {
          select: {
            fullName: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Generate unique verification ID
    const verificationId = `${course.slug}-${session.user.id}-${Date.now()}`

    // Generate certificate URL (this would normally be a PDF generation service)
    const certificateUrl = `/certificates/${verificationId}.pdf`

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        userId: session.user.id,
        courseId: validatedData.courseId,
        certificateUrl,
        verificationId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ certificate }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Certificate generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    )
  }
}
