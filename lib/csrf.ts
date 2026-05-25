import { cookies } from "next/headers"
import { randomBytes, createHash } from "crypto"

/**
 * CSRF Protection Utilities
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "x-csrf-token"
const TOKEN_LENGTH = 32

/**
 * Generate a secure random CSRF token
 */
function generateCSRFToken(): string {
  return randomBytes(TOKEN_LENGTH).toString("hex")
}

/**
 * Hash a token for comparison (timing-safe comparison)
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Generate and set CSRF token cookie
 * Returns the token that should be embedded in forms/headers
 */
export async function generateCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

/**
 * Validate CSRF token from request
 * Compares token from header against token from cookie
 */
export async function validateCSRFToken(
  requestToken: string | null
): Promise<boolean> {
  if (!requestToken) {
    return false
  }

  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!cookieToken) {
    return false
  }

  // Timing-safe comparison
  const requestHash = hashToken(requestToken)
  const cookieHash = hashToken(cookieToken)

  return requestHash === cookieHash
}

/**
 * Get CSRF token for client-side use
 * Returns the token that should be sent with state-changing requests
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

/**
 * Clear CSRF token (e.g., after logout)
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_COOKIE_NAME)
}

/**
 * Middleware to validate CSRF for state-changing operations
 */
export function requireCSRF(request: Request) {
  const csrfToken = request.headers.get(CSRF_HEADER_NAME)

  if (!csrfToken) {
    return false
  }

  return validateCSRFToken(csrfToken)
}

/**
 * Add CSRF token to response headers for GET requests
 * This allows clients to retrieve the token
 */
export function addCSRFToHeaders(headers: Headers, token: string) {
  headers.set(CSRF_HEADER_NAME, token)
  return headers
}
