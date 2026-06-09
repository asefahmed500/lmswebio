import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/jwt"
import { createHmac } from "crypto"

function verifyToken(
  token: string
): { userId: string; timestamp: number } | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  try {
    // Handle URL-safe base64 (replace - with + and _ with /)
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = JSON.parse(Buffer.from(base64, "base64").toString())
    const { sig, ...payload } = decoded
    if (!sig || !payload.userId || !payload.timestamp) return null

    const hmac = createHmac("sha256", secret)
    hmac.update(JSON.stringify(payload))
    const expectedSig = hmac.digest("hex")

    if (sig !== expectedSig) return null
    return payload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = z
      .object({
        token: z.string(),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[a-z]/, "Password must contain at least one lowercase letter")
          .regex(/[0-9]/, "Password must contain at least one number"),
      })
      .parse(body)

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    const tokenAge = Date.now() - decoded.timestamp
    if (tokenAge > 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 })
    }

    const expectedHash = createHmac("sha256", process.env.JWT_SECRET!)
      .update(token)
      .digest("hex")

    if (!user.resetToken || user.resetToken !== expectedHash) {
      return NextResponse.json(
        { error: "Reset token has already been used or is invalid" },
        { status: 400 }
      )
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            "Invalid password format. Password must be at least 8 characters with uppercase, lowercase, and a number.",
        },
        { status: 400 }
      )
    }
    console.error("POST /api/reset-password/confirm error:", error)
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    )
  }
}
