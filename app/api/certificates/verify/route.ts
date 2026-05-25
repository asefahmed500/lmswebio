/**
 * Certificate verification API
 * GET /api/certificates/verify?id={verificationId}
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/certificates/verify
 * Verify a certificate by its verification ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const verificationId = searchParams.get("id")

    if (!verificationId) {
      return NextResponse.json(
        { error: "Verification ID is required" },
        { status: 400 }
      )
    }

    const certificate = await prisma.certificate.findUnique({
      where: { verificationId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        studentName: certificate.user.fullName,
        courseName: certificate.course.title,
        issuedAt: certificate.issuedAt,
        verificationId: certificate.verificationId,
      },
    })
  } catch (error) {
    console.error("Certificate verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 }
    )
  }
}
