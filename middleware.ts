import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

const ROLE_PATH_MAP: Record<string, string> = {
  ADMIN: "/admin",
  INSTRUCTOR: "/instructor",
  STUDENT: "/student",
}

const ALLOWED_ROLES: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/instructor": ["INSTRUCTOR", "ADMIN"],
  "/student": ["STUDENT", "ADMIN"],
}

/**
 * State-changing methods that require CSRF protection
 */
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

function parseToken(token: string) {
  return jwtVerify(token, JWT_SECRET)
}

/**
 * Validate CSRF token for state-changing requests
 */
function validateCSRF(request: NextRequest): boolean {
  // Skip CSRF validation for GET requests
  if (!STATE_CHANGING_METHODS.has(request.method)) {
    return true
  }

  // Skip CSRF validation for API routes that handle their own validation
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return true
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get("x-csrf-token")
  if (!csrfToken) {
    return false
  }

  // Get CSRF token from cookie
  const csrfCookie = request.cookies.get("csrf_token")?.value
  if (!csrfCookie) {
    return false
  }

  // Compare tokens (timing-safe comparison would be better, but this is a start)
  return csrfToken === csrfCookie
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Validate CSRF for state-changing requests
  if (!validateCSRF(request)) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    )
  }

  const token = request.cookies.get("access_token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  let role: string | undefined

  try {
    const { payload } = await parseToken(token)
    if (!payload.sub || typeof payload.role !== "string") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    role = payload.role
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const segment = "/" + pathname.split("/")[1]

  const allowed = ALLOWED_ROLES[segment]
  if (!allowed || !allowed.includes(role)) {
    const redirectPath = ROLE_PATH_MAP[role] || "/login"
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/instructor/:path*", "/student/:path*"],
}
