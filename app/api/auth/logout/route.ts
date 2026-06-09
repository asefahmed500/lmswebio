import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRefreshToken, clearTokens } from "@/lib/auth/jwt"
import { clearCSRFToken } from "@/lib/csrf"

export async function POST(_: NextRequest) {
  try {
    const token = await getRefreshToken()

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } })
    }

    await Promise.all([clearTokens(), clearCSRFToken()])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
