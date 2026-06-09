import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { writeFile, mkdir } from "fs/promises"
import { join, basename } from "path"
import { v4 as uuidv4 } from "uuid"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
]

const ALLOWED_UPLOAD_DIRS = [
  "avatar",
  "course-thumbnail",
  "lesson-video",
  "assignment",
  "files",
]

// Map MIME types to safe extensions
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const identifier = `${getRateLimitIdentifier(request)}:upload`
    const rl = await rateLimit(identifier, {
      maxRequests: 30,
      windowMs: 60_000,
    })
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = (formData.get("type") as string) || "files"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate upload directory type against whitelist
    if (!ALLOWED_UPLOAD_DIRS.includes(type)) {
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      )
    }

    // Derive extension from MIME type (never from user-provided filename)
    const safeExtension = MIME_TO_EXT[file.type]
    if (!safeExtension) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      )
    }

    // Create uploads directory — use basename to strip any path components
    const safeDir = basename(type)
    const uploadsDir = join(process.cwd(), "public", "uploads", safeDir)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename with safe extension
    const filename = `${uuidv4()}.${safeExtension}`
    const filepath = join(uploadsDir, filename)

    // Verify the resolved path is still within public/uploads (path traversal guard)
    const resolvedPath = await import("fs/promises").then(() =>
      import("path").then(({ resolve }) => resolve(filepath))
    )
    const allowedBase = join(process.cwd(), "public", "uploads")
    if (!resolvedPath.startsWith(allowedBase)) {
      return NextResponse.json(
        { error: "Invalid upload path" },
        { status: 400 }
      )
    }

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the URL path
    const url = `/uploads/${safeDir}/${filename}`

    return NextResponse.json({
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
