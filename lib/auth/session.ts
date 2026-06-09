import { prisma } from "@/lib/prisma"

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  })
}

export async function getActiveSessionCount(userId: string): Promise<number> {
  return prisma.refreshToken.count({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
  })
}

export async function invalidateAllSessionsExcept(
  userId: string,
  currentToken: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      token: { not: currentToken },
    },
  })
}

export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}

setInterval(cleanupExpiredSessions, 24 * 60 * 60 * 1000)
