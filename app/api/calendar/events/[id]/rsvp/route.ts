/**
 * Calendar Event RSVP API
 * POST /api/calendar/events/[id]/rsvp - RSVP to an event
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const rsvpSchema = z.object({
  status: z.enum(["going", "maybe", "declined"]),
})

/**
 * POST /api/calendar/events/[id]/rsvp
 * RSVP to a calendar event
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: eventId } = await params
    const body = await req.json()
    const { status } = rsvpSchema.parse(body)

    // Verify event exists
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        course: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user can RSVP (must be enrolled in course or it's a global event)
    let canRsvp = false

    if (!event.courseId) {
      // Global event - anyone can RSVP
      canRsvp = true
    } else {
      // Course-specific event - check enrollment or instructor status
      const enrollment = await prisma.enrolment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: event.courseId,
          },
        },
      })

      const isInstructor = event.course?.instructorId === session.user.id
      const isAdmin = session.user.role === "ADMIN"

      canRsvp = !!enrollment || isInstructor || isAdmin
    }

    if (!canRsvp) {
      return NextResponse.json(
        { error: "You don't have permission to RSVP to this event" },
        { status: 403 }
      )
    }

    // Check for existing RSVP
    const existingRsvp = await prisma.calendarEventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    })

    if (existingRsvp) {
      // Update existing RSVP
      const updatedRsvp = await prisma.calendarEventAttendee.update({
        where: {
          eventId_userId: {
            eventId,
            userId: session.user.id,
          },
        },
        data: {
          status,
          respondedAt: new Date(),
        },
      })

      return NextResponse.json({ rsvp: updatedRsvp })
    } else {
      // Create new RSVP
      const rsvp = await prisma.calendarEventAttendee.create({
        data: {
          eventId,
          userId: session.user.id,
          status,
          respondedAt: new Date(),
        },
      })

      return NextResponse.json({ rsvp }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Calendar event RSVP error:", error)
    return NextResponse.json(
      { error: "Failed to RSVP to event" },
      { status: 500 }
    )
  }
}
