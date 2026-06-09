import { prisma } from "@/lib/prisma"

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now()
  const windowStart = new Date(now - config.windowMs)

  try {
    await prisma.rateLimitRecord.deleteMany({
      where: {
        timestamp: { lt: windowStart },
      },
    })

    const count = await prisma.rateLimitRecord.count({
      where: {
        identifier,
        timestamp: { gte: windowStart },
      },
    })

    if (count >= config.maxRequests) {
      return { success: false, remaining: 0 }
    }

    await prisma.rateLimitRecord.create({
      data: {
        identifier,
        timestamp: new Date(now),
      },
    })

    return { success: true, remaining: config.maxRequests - count - 1 }
  } catch (error) {
    console.error("Rate limiting error:", error)
    return { success: true, remaining: config.maxRequests - 1 }
  }
}

export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  return ip || "anonymous"
}

export async function cleanExpiredRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    await prisma.rateLimitRecord.deleteMany({
      where: { timestamp: { lt: cutoff } },
    })
  } catch (error) {
    console.error("Error cleaning expired rate limits:", error)
  }
}

setInterval(cleanExpiredRateLimits, 60 * 60 * 1000)
