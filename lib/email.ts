import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const FROM_ADDRESS = process.env.EMAIL_FROM || "lmsio <asefxahmed@gmail.com>"

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000"

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    })
    console.log(`Email sent to ${options.to}: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`
  return sendEmail({
    to,
    subject: "Password Reset - LMS Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your LMS account.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">LMS Platform</p>
      </div>
    `,
  })
}

export async function sendVerificationEmail(to: string, verifyToken: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${verifyToken}`
  return sendEmail({
    to,
    subject: "Verify Your Email - LMS Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Thank you for creating an account on LMS Platform.</p>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p>This link expires in 7 days.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">LMS Platform</p>
      </div>
    `,
  })
}
