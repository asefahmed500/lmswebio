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
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { apiPatch, apiDelete } from "@/lib/api-client"

interface Notification {
  id: number
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
      return <CheckCircle className="text-success size-5 shrink-0" />
    case "warning":
      return <AlertTriangle className="text-warning size-5 shrink-0" />
    case "error":
      return <XCircle className="size-5 shrink-0 text-destructive" />
    default:
      return <Info className="text-info size-5 shrink-0" />
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
    await apiPatch("/notifications", { markAll: true } as unknown as Record<
      string,
      unknown
    >)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleMarkRead = async (id: number) => {
    await apiPatch("/notifications", {
      notificationIds: [id],
      read: true,
    } as unknown as Record<string, unknown>)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleDeleteAll = async () => {
    await apiDelete("/notifications")
    setNotifications([])
  }

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 size-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="mr-2 size-4" />
              Clear all
            </Button>
          )}
        </div>
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
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-4 size-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">
                {filter === "unread"
                  ? "No unread notifications"
                  : "No notifications"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "You'll see notifications here when there's activity."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
