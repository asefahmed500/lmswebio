import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

function getSecret(key: string): Uint8Array {
  const secret = process.env[key]
  if (!secret) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  if (secret.length < 32) {
    throw new Error(`Environment variable ${key} must be at least 32 characters for security`)
  }
  return new TextEncoder().encode(secret)
}

const JWT_SECRET = getSecret("JWT_SECRET")
const JWT_REFRESH_SECRET = getSecret("JWT_REFRESH_SECRET")

const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY = "7d"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signAccessToken(
  userId: number,
  role: string
): Promise<string> {
  return new SignJWT({ sub: String(userId), role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function signRefreshToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_REFRESH_SECRET)
}

export async function verifyAccessToken(
  token: string
): Promise<{ sub: number; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (!payload.sub || typeof payload.role !== "string") return null
    return { sub: Number(payload.sub), role: payload.role }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ sub: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
    if (!payload.sub) return null
    return { sub: Number(payload.sub) }
  } catch {
    return null
  }
}

export async function setTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  })

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
}

export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("access_token", "", { maxAge: 0, path: "/" })
  cookieStore.set("refresh_token", "", { maxAge: 0, path: "/" })
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get("access_token")?.value
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get("refresh_token")?.value
}

export async function getSession(): Promise<{
  user: { id: number; email: string; fullName: string; role: string }
} | null> {
  const token = await getAccessToken()
  if (!token) return null

  const payload = await verifyAccessToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, fullName: true, role: true },
  })

  if (!user) return null

  return { user }
}
