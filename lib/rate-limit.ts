import { prisma } from "@/lib/prisma"

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const cleanupCache = new Map<string, number>()
const CLEANUP_INTERVAL = 60_000

const memoryRateLimit = new Map<
  string,
  { timestamps: number[]; lastCleanup: number }
>()

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now()
  const windowStartDate = new Date(now - config.windowMs)

  const mem = memoryRateLimit.get(identifier)
  if (mem) {
    const validTimestamps = mem.timestamps.filter((t) => t > now - config.windowMs)
    if (validTimestamps.length >= config.maxRequests) {
      mem.timestamps = validTimestamps
      return { success: false, remaining: 0 }
    }
    validTimestamps.push(now)
    mem.timestamps = validTimestamps
    mem.lastCleanup = now
  } else {
    memoryRateLimit.set(identifier, {
      timestamps: [now],
      lastCleanup: now,
    })
  }

  try {
    const lastCleanup = cleanupCache.get(identifier) || 0
    if (now - lastCleanup > CLEANUP_INTERVAL) {
      await prisma.rateLimitRecord.deleteMany({
        where: {
          identifier,
          timestamp: { lt: windowStartDate },
        },
      })
      cleanupCache.set(identifier, now)
    }

    const count = await prisma.rateLimitRecord.count({
      where: {
        identifier,
        timestamp: { gte: windowStartDate },
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

    return {
      success: true,
      remaining: config.maxRequests - count - 1,
    }
  } catch (error) {
    console.error("Rate limiting error:", error)
    return { success: true, remaining: config.maxRequests - 1 }
  }
}

if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, mem] of memoryRateLimit) {
      mem.timestamps = mem.timestamps.filter((t) => t > now - 60000)
      if (mem.timestamps.length === 0) {
        memoryRateLimit.delete(key)
      }
    }
  }, 60_000)
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref()
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
