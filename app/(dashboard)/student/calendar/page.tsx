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
import { apiGet, apiPost } from "@/lib/api-client"
import { toast } from "sonner"

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
  const [selectedEvent, setSelectedEvent] =
    React.useState<CalendarEvent | null>(null)

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

        const result = await apiGet<Record<string, CalendarEvent[]>>(
          `/calendar/events?${params}`
        )
        if (result.data) {
          setEvents(result.data.events)
        }
        if (result.error) {
          toast.error("Failed to load calendar events")
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
      const result = await apiPost(`/calendar/events/${eventId}/rsvp`, {
        status,
      })

      if (result.data) {
        setEvents((prev) =>
          prev.map((event) =>
            event.id === eventId ? { ...event, userRsvp: status } : event
          )
        )
      } else {
        toast.error("Failed to update RSVP")
      }
    } catch (error) {
      console.error("Failed to RSVP:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
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
    live_session: "bg-info",
    deadline: "bg-destructive",
    assignment_due: "bg-warning",
    quiz: "bg-primary",
    other: "bg-muted-foreground",
  }

  const eventTypeLabels: Record<string, string> = {
    live_session: "Live Session",
    deadline: "Deadline",
    assignment_due: "Assignment Due",
    quiz: "Quiz",
    other: "Other",
  }

  return (
    <div className="flex flex-col gap-6">
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
                <div className="mb-4 flex items-center gap-3">
                  <Badge className={eventTypeColors[selectedEvent.eventType]}>
                    {eventTypeLabels[selectedEvent.eventType]}
                  </Badge>
                  <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                </div>

                {selectedEvent.description && (
                  <p className="mb-4 text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                )}

                <div className="flex flex-col gap-2 text-sm">
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
                    variant={
                      selectedEvent.userRsvp === "going" ? "default" : "outline"
                    }
                    onClick={() => handleRsvp(selectedEvent.id, "going")}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Going
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedEvent.userRsvp === "maybe" ? "default" : "outline"
                    }
                    onClick={() => handleRsvp(selectedEvent.id, "maybe")}
                  >
                    Maybe
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedEvent.userRsvp === "declined"
                        ? "default"
                        : "outline"
                    }
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
