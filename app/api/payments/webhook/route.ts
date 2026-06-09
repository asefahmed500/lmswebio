import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"

/**
 * POST /api/payments/webhook
 * Handles Stripe webhook events for payment status updates.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    )
  }

  const sig = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    )
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent> | undefined

  try {
    const body = await request.text()
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string
          metadata?: Record<string, string>
          payment_intent?: string
        }
        const metadata = session.metadata || {}
        const userId = metadata.userId || ""
        const courseId = metadata.courseId || ""

        if (userId && courseId) {
          // Update payment record
          await prisma.payment.updateMany({
            where: { stripeSessionId: session.id },
            data: { status: "completed" },
          })

          // Skip if already enrolled (prevents duplicate on webhook replay)
          const existingEnrolment = await prisma.enrolment.findUnique({
            where: { userId_courseId: { userId, courseId } },
          })
          if (!existingEnrolment) {
            const course = await prisma.course.findUnique({
              where: { id: courseId },
            })
            await prisma.enrolment.create({
              data: {
                userId,
                courseId,
                paymentStatus: "paid",
                amount: course?.price || 0,
                paymentId: session.payment_intent || undefined,
              },
            })
          }
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as { id: string }
        await prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "failed" },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
