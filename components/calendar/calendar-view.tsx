"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns"

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

interface CalendarViewProps {
  events: CalendarEvent[]
  currentDate?: Date
  onDateChange?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarView({
  events,
  currentDate = new Date(),
  onDateChange,
  onEventClick,
}: CalendarViewProps) {
  const [viewDate, setViewDate] = React.useState(currentDate)

  const handlePreviousMonth = () => {
    const newDate = subMonths(viewDate, 1)
    setViewDate(newDate)
    onDateChange?.(newDate)
  }

  const handleNextMonth = () => {
    const newDate = addMonths(viewDate, 1)
    setViewDate(newDate)
    onDateChange?.(newDate)
  }

  const handleToday = () => {
    setViewDate(new Date())
    onDateChange?.(new Date())
  }

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get events for each day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return isSameDay(eventDate, day)
    })
  }

  const eventTypeColors: Record<string, string> = {
    live_session: "bg-blue-500",
    deadline: "bg-red-500",
    assignment_due: "bg-orange-500",
    quiz: "bg-purple-500",
    other: "bg-gray-500",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(viewDate, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, viewDate)
            const isDayToday = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border rounded-lg transition-colors ${
                  !isCurrentMonth
                    ? "bg-muted/30 opacity-50"
                    : "bg-background"
                } ${isDayToday ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isDayToday ? "text-primary" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: eventTypeColors[event.eventType] + "20",
                        borderLeft: `2px solid ${eventTypeColors[event.eventType]}`,
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.startTime), "HH:mm")}
                      </div>
                    </div>
                  ))}

                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-sm font-medium">Event Types:</span>
          <div className="flex items-center gap-3 text-sm">
            {Object.entries(eventTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className={`h-3 w-3 rounded ${color.replace("500", "500")}`}
                />
                <span className="capitalize">
                  {type.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
