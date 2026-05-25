/**
 * Student Calendar Page
 * View upcoming events, deadlines, and schedule
 */

"use client"

import * as React from "react"
import { Calendar, Clock, MapPin, Users, Check } from "lucide-react"
import { CalendarView } from "@/components/calendar/calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { LoadingCard } from "@/components/loading-skeleton"

interface CalendarEvent {
  id: number
  title: string
  description: string | null
  eventType: string
  startTime: string
  endTime: string | null
  location: string | null
  course: {
    id: number
    title: string
    slug: string
    thumbnail: string | null
  } | null
  userRsvp: string | null
  _count: {
    attendees: number
  }
}

export default function StudentCalendarPage() {
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)

  React.useEffect(() => {
    async function loadEvents() {
      setIsLoading(true)
      try {
        const startDate = new Date(selectedDate)
        startDate.setDate(startDate.getDate() - 30) // 30 days before
        const endDate = new Date(selectedDate)
        endDate.setDate(endDate.getDate() + 90) // 90 days after

        const params = new URLSearchParams()
        params.append("startDate", startDate.toISOString())
        params.append("endDate", endDate.toISOString())

        const response = await fetch(`/api/calendar/events?${params}`)
        if (response.ok) {
          const data = await response.json()
          setEvents(data.events)
        }
      } catch (error) {
        console.error("Failed to load events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [selectedDate])

  const handleRsvp = async (eventId: number, status: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setEvents((prev) =>
          prev.map((event) =>
            event.id === eventId ? { ...event, userRsvp: status } : event
          )
        )
      }
    } catch (error) {
      console.error("Failed to RSVP:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="mt-1 text-muted-foreground">
            View your schedule and upcoming events
          </p>
        </div>
        <LoadingCard />
      </div>
    )
  }

  const eventTypeColors: Record<string, string> = {
    live_session: "bg-blue-500",
    deadline: "bg-red-500",
    assignment_due: "bg-orange-500",
    quiz: "bg-purple-500",
    other: "bg-gray-500",
  }

  const eventTypeLabels: Record<string, string> = {
    live_session: "Live Session",
    deadline: "Deadline",
    assignment_due: "Assignment Due",
    quiz: "Quiz",
    other: "Other",
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="mt-1 text-muted-foreground">
          View your schedule and upcoming events
        </p>
      </div>

      {/* Calendar */}
      <CalendarView
        events={events}
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        onEventClick={setSelectedEvent}
      />

      {/* Selected Event Details */}
      {selectedEvent && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={eventTypeColors[selectedEvent.eventType]}>
                    {eventTypeLabels[selectedEvent.eventType]}
                  </Badge>
                  <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                </div>

                {selectedEvent.description && (
                  <p className="text-muted-foreground mb-4">
                    {selectedEvent.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(selectedEvent.startTime), "PPp")}
                      {selectedEvent.endTime &&
                        ` - ${format(new Date(selectedEvent.endTime), "p")}`}
                    </span>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}

                  {selectedEvent.course && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Course:</span>
                      <span>{selectedEvent.course.title}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent._count.attendees} attending</span>
                  </div>
                </div>
              </div>

              {/* RSVP Buttons */}
              {selectedEvent.eventType === "live_session" && (
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={selectedEvent.userRsvp === "going" ? "default" : "outline"}
                    onClick={() => handleRsvp(selectedEvent.id, "going")}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Going
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEvent.userRsvp === "maybe" ? "default" : "outline"}
                    onClick={() => handleRsvp(selectedEvent.id, "maybe")}
                  >
                    Maybe
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEvent.userRsvp === "declined" ? "default" : "outline"}
                    onClick={() => handleRsvp(selectedEvent.id, "declined")}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
