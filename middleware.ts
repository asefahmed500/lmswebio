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

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

const CSRF_EXEMPT_PATHS = [
  "/api/auth/",
  "/api/csrf-token",
  "/api/payments/webhook",
]

function parseToken(token: string) {
  return jwtVerify(token, JWT_SECRET)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function validateCSRF(request: NextRequest): boolean {
  if (!STATE_CHANGING_METHODS.has(request.method)) {
    return true
  }

  const { pathname } = request.nextUrl

  if (CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
    return true
  }

  const csrfToken = request.headers.get("x-csrf-token")
  if (!csrfToken) {
    return false
  }

  const csrfCookie = request.cookies.get("csrf_token")?.value
  if (!csrfCookie) {
    return false
  }

  return timingSafeEqual(csrfToken, csrfCookie)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!validateCSRF(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  if (!pathname.startsWith("/api")) {
    if (
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/courses")
    ) {
      return NextResponse.next()
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
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/api/:path*",
    "/privacy",
    "/terms",
    "/courses/:path*",
  ],
}
