import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  setTokens,
} from "@/lib/auth/jwt"
import { z } from "zod"

const registerBodySchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const parsed = registerBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { fullName, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: "STUDENT",
      },
      select: { id: true, email: true, fullName: true, role: true },
    })

    const accessToken = await signAccessToken(user.id, user.role)
    const refreshToken = await signRefreshToken(user.id)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    await setTokens(accessToken, refreshToken)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
