import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/jwt"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

/**
 * POST /api/payments/checkout
 * Creates a Stripe checkout session for a paid course.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can purchase courses" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    if (!course.isPublished) {
      return NextResponse.json(
        { error: "Course is not published" },
        { status: 400 }
      )
    }
    if (!course.price || course.price <= 0) {
      return NextResponse.json(
        { error: "This course is free - enroll directly" },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existing = await prisma.enrolment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    })
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 })
    }

    const baseUrl = request.nextUrl.origin

    // If Stripe is not configured, use a simple direct-payment flow
    if (!isStripeConfigured()) {
      // Create enrollment with "paid" status directly (demo mode)
      const enrolment = await prisma.enrolment.create({
        data: {
          userId: session.user.id,
          courseId,
          paymentStatus: "paid",
          amount: course.price,
        },
      })

      await prisma.payment.create({
        data: {
          userId: session.user.id,
          courseId,
          amount: course.price,
          status: "completed",
        },
      })

      return NextResponse.json({
        success: true,
        url: `/student/courses/${courseId}`,
        demoMode: true,
      })
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment service is not configured" },
        { status: 500 }
      )
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
              description: course.description?.substring(0, 500) || undefined,
            },
            unit_amount: Math.round(course.price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/student/courses/${courseId}?payment=success`,
      cancel_url: `${baseUrl}/student/checkout/${courseId}?canceled=true`,
      metadata: {
        userId: String(session.user.id),
        courseId: String(courseId),
      },
    })

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        courseId,
        amount: course.price,
        status: "pending",
        stripeSessionId: checkoutSession.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
