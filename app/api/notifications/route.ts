import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import {
  createNotificationSchema,
  updateNotificationSchema,
  markAllReadSchema,
} from "@/lib/validators/notifications"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    const where: Prisma.NotificationWhereInput = { userId: session.user.id }
    if (unreadOnly) {
      where.read = false
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const data = createNotificationSchema.parse(body)

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Create notification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { notificationIds, read, markAll } = body

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      const parsedIds = z.array(z.string().min(1)).safeParse(notificationIds)
      if (!parsedIds.success) {
        return NextResponse.json(
          { error: "Invalid notification IDs" },
          { status: 400 }
        )
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: parsedIds.data },
          userId: session.user.id,
        },
        data: { read: read !== undefined ? read : true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (notificationId) {
      if (!notificationId) {
        return NextResponse.json(
          { error: "Invalid notification ID" },
          { status: 400 }
        )
      }

      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      })
    } else {
      await prisma.notification.deleteMany({
        where: { userId: session.user.id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
