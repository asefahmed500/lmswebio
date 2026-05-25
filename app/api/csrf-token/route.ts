import { NextResponse } from "next/server"
import { generateCSRFToken } from "@/lib/csrf"

/**
 * GET /api/csrf-token
 * Returns a CSRF token for use in forms and API requests
 *
 * Clients should:
 * 1. Call this endpoint to get a token
 * 2. Include the token in the X-CSRF-Token header for state-changing requests
 * 3. Store the token temporarily for use in forms
 */
export async function GET() {
  try {
    const token = await generateCSRFToken()

    return NextResponse.json(
      { token },
      {
        headers: {
          "X-CSRF-Token": token,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("CSRF token generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    )
  }
}
