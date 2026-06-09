import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getRefreshToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setTokens,
} from "@/lib/auth/jwt"

export async function POST(_: NextRequest) {
  try {
    const token = await getRefreshToken()
    if (!token) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      )
    }

    const payload = await verifyRefreshToken(token)
    if (!payload) {
      await prisma.refreshToken.deleteMany({ where: { token } })
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      )
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    })
    if (!storedToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    })
    if (!user || !user.isActive) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } })
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 401 }
      )
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } })

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

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
