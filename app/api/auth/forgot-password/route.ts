import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"
import { createHmac } from "crypto"

function signToken(payload: object): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET environment variable is required")
  const data = JSON.stringify(payload)
  const hmac = createHmac("sha256", secret)
  hmac.update(data)
  const signature = hmac.digest("hex")
  // URL-safe base64: replace + with -, / with _, remove trailing =
  return Buffer.from(JSON.stringify({ ...payload, sig: signature }))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function POST(request: NextRequest) {
  try {
    const identifier = `${getRateLimitIdentifier(request)}:forgot-password`
    const rateLimitResult = await rateLimit(identifier, {
      maxRequests: 5,
      windowMs: 5 * 60 * 1000,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many password reset attempts. Please try again later.",
          remaining: rateLimitResult.remaining,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = z.object({ email: z.string().email() }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent." },
        { status: 200 }
      )
    }

    const resetToken = signToken({ userId: user.id, timestamp: Date.now() })

    // Store the reset token hash in the user record for verification
    const tokenHash = createHmac("sha256", process.env.JWT_SECRET!)
      .update(resetToken)
      .digest("hex")

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    // Send password reset email
    const { sendPasswordResetEmail } = await import("@/lib/email")
    await sendPasswordResetEmail(email, resetToken)

    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent." },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
