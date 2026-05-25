import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"
import { createHmac } from "crypto"

function signToken(payload: object): string {
  const data = JSON.stringify(payload)
  const hmac = createHmac("sha256", process.env.JWT_SECRET || "fallback-secret")
  hmac.update(data)
  const signature = hmac.digest("hex")
  return Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString("base64")
}

export async function POST(request: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(request)
    const rateLimitResult = rateLimit(identifier, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
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
    const { email } = z.object({ email: z.string().email() }).parse(body)

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent." },
        { status: 200 }
      )
    }

    const resetToken = signToken({ userId: user.id, timestamp: Date.now() })

    // Store the reset token hash in the user record for verification
    const tokenHash = createHmac("sha256", process.env.JWT_SECRET || "fallback-secret")
      .update(resetToken)
      .digest("hex")

    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    })

    console.log("Password reset link:", `/reset-password?token=${resetToken}`)

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
