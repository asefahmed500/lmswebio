import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRefreshToken, clearTokens } from "@/lib/auth/jwt"

export async function POST(_request: NextRequest) {
  try {
    const token = await getRefreshToken()

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } })
    }

    await clearTokens()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
