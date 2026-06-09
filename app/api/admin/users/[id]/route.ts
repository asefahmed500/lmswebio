import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, hashPassword } from "@/lib/auth/jwt"
import { z } from "zod"

const updateUserSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200).optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        _count: { select: { courses: true, enrolments: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("GET /api/admin/users/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: userId } = await params

    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}

    if (parsed.data.fullName !== undefined) data.fullName = parsed.data.fullName
    if (parsed.data.email !== undefined) data.email = parsed.data.email
    if (parsed.data.role !== undefined) data.role = parsed.data.role
    if (parsed.data.password)
      data.passwordHash = await hashPassword(parsed.data.password)
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("PUT /api/admin/users/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: userId } = await params

    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (existing.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin" },
          { status: 400 }
        )
      }
    }

    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
