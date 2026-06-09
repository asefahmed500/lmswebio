import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createHmac } from "crypto"

function verifyToken(
  token: string
): { userId: string; email: string; timestamp: number } | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    const { sig, ...payload } = decoded
    if (!sig || !payload.userId || !payload.email || !payload.timestamp)
      return null

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
    const { token } = z.object({ token: z.string() }).parse(body)

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    const tokenAge = Date.now() - decoded.timestamp
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (tokenAge > sevenDays) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || user.email !== decoded.email) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      )
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isEmailVerified: true },
    })

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
