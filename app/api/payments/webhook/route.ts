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
          payment_intent?: string | null
          payment_status?: string
          amount_total?: number | null
        }
        const metadata = session.metadata || {}
        const userId = metadata.userId || ""
        const courseId = metadata.courseId || ""

        // A completed checkout session is not proof of settlement — only
        // "paid" sessions may grant access.
        if (!userId || !courseId || session.payment_status !== "paid") break

        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.findFirst({
            where: { stripeSessionId: session.id },
          })
          if (!payment) {
            console.error("Webhook for unknown checkout session:", session.id)
            return
          }

          if (
            session.amount_total != null &&
            Math.abs(session.amount_total / 100 - payment.amount) > 0.01
          ) {
            console.error("Webhook amount mismatch for session:", session.id)
            return
          }

          // Replace the pending_<uuid> placeholder with the real intent id.
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "completed",
              ...(session.payment_intent
                ? { stripePaymentIntentId: session.payment_intent }
                : {}),
            },
          })

          // Skip if already enrolled (prevents duplicate on webhook replay).
          const existingEnrolment = await tx.enrolment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            select: { id: true },
          })
          if (!existingEnrolment) {
            const course = await tx.course.findUnique({
              where: { id: courseId },
              select: { price: true },
            })
            await tx.enrolment.create({
              data: {
                userId,
                courseId,
                paymentStatus: "paid",
                amount: course?.price ?? payment.amount,
                paymentId: session.payment_intent ?? payment.id,
              },
            })
          }
        })
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
