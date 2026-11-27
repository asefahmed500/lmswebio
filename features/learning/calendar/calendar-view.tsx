"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"

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

/** Semantic-token classes only — no inline colours or constructed hex values. */
const eventRowClasses: Record<string, string> = {
  live_session: "border-l-2 border-l-info bg-info/10 text-info",
  deadline:
    "border-l-2 border-l-destructive bg-destructive/10 text-destructive",
  assignment_due: "border-l-2 border-l-warning bg-warning/10 text-warning",
  quiz: "border-l-2 border-l-primary bg-primary/10 text-primary",
  other: "border-l-2 border-l-muted-foreground bg-muted text-foreground",
}

const eventBadgeVariants: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  live_session: "info",
  deadline: "destructive",
  assignment_due: "warning",
  quiz: "default",
  other: "secondary",
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

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return isSameDay(eventDate, day)
    })
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5" />
            {format(viewDate, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handlePreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft data-icon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight data-icon />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, viewDate)
            const isDayToday = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-24 min-w-0 rounded-lg border border-border p-2 transition-colors",
                  !isCurrentMonth ? "bg-muted/30 opacity-50" : "bg-background",
                  isDayToday && "ring-2 ring-primary"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isDayToday && "text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Button
                      key={event.id}
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        "h-auto w-full justify-start p-1 text-left whitespace-normal",
                        eventRowClasses[event.eventType] ??
                          eventRowClasses.other
                      )}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {event.title}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="size-3" />
                          {format(new Date(event.startTime), "HH:mm")}
                        </span>
                      </span>
                    </Button>
                  ))}

                  {dayEvents.length > 3 && (
                    <div className="text-center text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Separator className="mt-4" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
          <span className="text-sm font-medium">Event Types:</span>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {Object.keys(eventBadgeVariants).map((type) => (
              <Badge
                key={type}
                variant={eventBadgeVariants[type]}
                className="capitalize"
              >
                {type.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
