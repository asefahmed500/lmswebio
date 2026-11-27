"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CheckCheck,
  Trash2,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { PageLoading } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { apiPatch, apiDelete } from "@/lib/api-client"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  createdAt: string
}

function getNotifIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle className="size-5 shrink-0 text-success" />
    case "warning":
      return <AlertTriangle className="size-5 shrink-0 text-warning" />
    case "error":
      return <XCircle className="size-5 shrink-0 text-destructive" />
    default:
      return <Info className="size-5 shrink-0 text-info" />
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "Just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  // Mutation failures surface here; apiPost/apiPatch/apiDelete resolve { error }`n  // and never throw, so without this a failed write silently changed the UI.
  const [error, setError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<"all" | "unread">("all")

  React.useEffect(() => {
    async function loadNotifications() {
      if (!user) return
      setIsLoading(true)
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        }
      } catch (error) {
        console.error("Failed to load notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadNotifications()
  }, [user])

  const handleMarkAllRead = async () => {
    // apiPatch resolves `{ error }` and never throws, so a failed request
    // previously still flipped every row to read in local state. The list then
    // claimed everything was read while the server still had it unread.
    const res = await apiPatch("/notifications", {
      markAll: true,
    } as unknown as Record<string, unknown>)
    if (res.error) {
      setError(res.error)
      return
    }
    setError(null)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleMarkRead = async (id: string) => {
    const res = await apiPatch("/notifications", {
      notificationIds: [id],
      read: true,
    } as unknown as Record<string, unknown>)
    if (res.error) {
      setError(res.error)
      return
    }
    setError(null)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleDeleteAll = async () => {
    // Same defect: a failed DELETE emptied the list and rendered
    // "No notifications" while nothing was actually removed.
    const res = await apiDelete("/notifications")
    if (res.error) {
      setError(res.error)
      return
    }
    setError(null)
    setNotifications([])
  }
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) return <PageLoading label="Loading notifications…" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Back to dashboard"
          className="shrink-0"
        >
          <Link href="/admin">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader
          title="Notifications"
          description={
            unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up!"
          }
          className="min-w-0 flex-1"
          action={
            <>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  <CheckCheck data-icon="inline-start" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleDeleteAll}>
                  <Trash2 data-icon="inline-start" />
                  Clear all
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length > 0 ? (
            <div className="flex flex-col">
              {filteredNotifications.map((n) => (
                <Button
                  key={n.id}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "flex h-auto w-full items-start gap-4 rounded-none border-b p-4 text-left transition-colors last:border-b-0 hover:bg-muted/50",
                    !n.read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.id)
                    if (n.link) window.location.href = n.link
                  }}
                >
                  <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm", !n.read && "font-medium")}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bell />
                </EmptyMedia>
                <EmptyTitle>
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications"}
                </EmptyTitle>
                <EmptyDescription>
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "You'll see notifications here when there's activity."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
