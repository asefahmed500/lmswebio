import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  to: z.email(),
})

/** POST /api/settings/test-email — send a test message using saved SMTP settings. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    })

    if (
      !settings?.smtpHost ||
      !settings.smtpUser ||
      !settings.smtpPass ||
      !settings.smtpFrom
    ) {
      return NextResponse.json(
        { error: "SMTP is not configured. Save the settings first." },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      secure: settings.smtpSecure,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    })

    const info = await transporter.sendMail({
      from: settings.smtpFrom,
      to: parsed.data.to,
      subject: "LMSio test email",
      text: "This is a test email from your LMSio installation.",
    })

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      { error: "Could not send the test email" },
      { status: 502 }
    )
  }
}
