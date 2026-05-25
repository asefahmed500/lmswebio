import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null })
  }
}
