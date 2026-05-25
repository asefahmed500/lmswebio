/**
 * Calendar Events API endpoints
 * GET /api/calendar/events - List calendar events
 * POST /api/calendar/events - Create a calendar event
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/jwt"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  eventType: z.enum(["live_session", "deadline", "assignment_due", "quiz", "other"]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  location: z.string().optional(),
  courseId: z.number().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
})

/**
 * GET /api/calendar/events
 * List calendar events with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const courseId = searchParams.get("courseId")
    const eventType = searchParams.get("eventType")

    const where: any = {
      OR: [
        { createdBy: session.user.id },
        { courseId: { in: undefined } }, // Will be populated below
      ],
    }

    // If filtering by date range
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (courseId) {
      where.courseId = parseInt(courseId)
    }

    if (eventType) {
      where.eventType = eventType
    }

    // Get user's enrolled courses for course-specific events
    const enrollments = await prisma.enrolment.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      select: {
        courseId: true,
      },
    })

    const enrolledCourseIds = enrollments.map((e) => e.courseId)

    // For instructors, get their courses too
    let instructorCourseIds: number[] = []
    if (session.user.role === "INSTRUCTOR") {
      const courses = await prisma.course.findMany({
        where: {
          instructorId: session.user.id,
        },
        select: {
          id: true,
        },
      })
      instructorCourseIds = courses.map((c) => c.id)
    }

    const relevantCourseIds = [
      ...new Set([...enrolledCourseIds, ...instructorCourseIds]),
    ]

    // Update where clause to include relevant courses or global events
    where.OR = [
      { courseId: { in: relevantCourseIds } },
      { courseId: null },
      { createdBy: session.user.id },
    ]

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    })

    // Get user's RSVP status for events
    const eventIds = events.map((e) => e.id)
    const userAttendees = await prisma.calendarEventAttendee.findMany({
      where: {
        eventId: { in: eventIds },
        userId: session.user.id,
      },
    })

    const attendeeMap = new Map(
      userAttendees.map((a) => [a.eventId, a.status])
    )

    const eventsWithRsvp = events.map((event) => ({
      ...event,
      userRsvp: attendeeMap.get(event.id) || null,
    }))

    return NextResponse.json({ events: eventsWithRsvp })
  } catch (error) {
    console.error("Calendar events fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createEventSchema.parse(body)

    // If course-specific, verify user has permission
    if (validatedData.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: validatedData.courseId },
      })

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 })
      }

      const isInstructor = course.instructorId === session.user.id
      const isAdmin = session.user.role === "ADMIN"

      if (!isInstructor && !isAdmin) {
        return NextResponse.json(
          { error: "You don't have permission to create events for this course" },
          { status: 403 }
        )
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        eventType: validatedData.eventType,
        startTime: new Date(validatedData.startTime),
        endTime: validatedData.endTime
          ? new Date(validatedData.endTime)
          : null,
        location: validatedData.location,
        courseId: validatedData.courseId,
        isRecurring: validatedData.isRecurring,
        recurrencePattern: validatedData.recurrencePattern,
        createdBy: session.user.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Calendar event creation error:", error)
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    )
  }
}
