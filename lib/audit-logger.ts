import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function logAction(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? (details as Prisma.InputJsonValue) : undefined,
      },
    })
  } catch (error) {
    console.error("Audit log write failed:", error)
  }
}
