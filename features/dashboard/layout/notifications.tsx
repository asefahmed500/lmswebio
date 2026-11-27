"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from "lucide-react"

import type { User } from "@/types"
import { apiGet, apiPatch } from "@/lib/api-client"
import { useIsDesktop } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingTable } from "@/components/loading-skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  createdAt: string
}

const POLL_INTERVAL_MS = 30_000
const TICK_INTERVAL_MS = 60_000
const MAX_VISIBLE = 10

/**
 * A ticking clock for relative timestamps.
 *
 * The original implementation stored `Date.now()` in a ref during render and read
 * `ref.current` in the markup. A ref never triggers a re-render, so every "5m
 * ago" label froze at whatever it was when the panel mounted and then went
 * permanently stale. It was also the source of two lint errors — calling an
 * impure function during render, and reading a ref during render.
 *
 * `useSyncExternalStore` is the right primitive, but it requires `getSnapshot`
 * to return a value that is *cached between changes*. Returning `Date.now()`
 * directly violates that contract: every call returns a new value, so React
 * sees a change on every render and re-renders forever ("Maximum update depth
 * exceeded"). The timestamp is therefore cached in module scope and only
 * advanced by the interval, so consecutive reads are `Object.is`-equal.
 *
 * The server snapshot is null so relative labels do not appear until after
 * hydration.
 */
let cachedNow: number | null = null
const clockListeners = new Set<() => void>()
let clockTimer: ReturnType<typeof setInterval> | undefined

function getClockSnapshot(): number | null {
  return cachedNow
}

const getServerClockSnapshot = (): number | null => null

function subscribeToClock(onStoreChange: () => void): () => void {
  clockListeners.add(onStoreChange)

  if (clockListeners.size === 1) {
    cachedNow = Date.now()
    clockTimer = setInterval(() => {
      cachedNow = Date.now()
      clockListeners.forEach((listener) => listener())
    }, TICK_INTERVAL_MS)
  }

  return () => {
    clockListeners.delete(onStoreChange)
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer)
      clockTimer = undefined
      cachedNow = null
    }
  }
}

function useNow(): number | null {
  return React.useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getServerClockSnapshot
  )
}

export function formatRelativeTime(iso: string, now: number | null): string {
  if (now === null) return ""
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""

  const diff = now - then
  if (diff < 0) return "just now"

  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const TYPE_TONE: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
}

function NotificationIcon({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] ?? Info
  const tone = TYPE_TONE[type] ?? TYPE_TONE.info
  return <Icon className={cn("size-4 shrink-0", tone)} />
}

/**
 * Notification data with self-scheduling polling.
 *
 * The next poll is chained off the previous response rather than driven by a
 * fixed interval, so a slow response cannot stack requests. Polls are skipped
 * while the tab is hidden and resumed on `visibilitychange`, and every request
 * carries an `AbortController` signal so an in-flight poll is cancelled on
 * unmount instead of resolving into a dead component.
 */
function useNotifications() {
  const [items, setItems] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller = new AbortController()

    const load = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const result = await apiGet<{
          notifications: NotificationItem[]
          unreadCount: number
        }>("/notifications", { signal: controller.signal })
        if (cancelled) return
        if (result.data) {
          setItems(result.data.notifications ?? [])
          setUnreadCount(result.data.unreadCount ?? 0)
        }
      } catch {
        // apiGet folds failures into `{ error }`; a missed poll is not worth
        // surfacing and the next tick retries.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Single self-rescheduling chain.
    const tick = async () => {
      await load()
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return
      // A fresh controller: the previous one may have been aborted.
      controller = new AbortController()
      if (timer) clearTimeout(timer)
      void tick()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    void tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      controller.abort()
    }
  }, [])

  const markAllRead = React.useCallback(async () => {
    const result = await apiPatch("/notifications", { markAll: true })
    if (result.error) return
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const markRead = React.useCallback(async (id: string) => {
    const result = await apiPatch("/notifications", {
      notificationIds: [id],
      read: true,
    })
    if (result.error) return
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  return { items, unreadCount, loading, markAllRead, markRead }
}

function NotificationList({
  items,
  loading,
  now,
  onSelect,
}: {
  items: NotificationItem[]
  loading: boolean
  now: number | null
  onSelect: (item: NotificationItem) => void
}) {
  if (loading && items.length === 0) {
    return (
      <div aria-busy="true">
        <LoadingTable rows={3} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Bell className="size-7 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">You are all caught up</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {items.slice(0, MAX_VISIBLE).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            "flex w-full items-start gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-b-0",
            "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
            !item.read && "bg-primary/[0.04]"
          )}
        >
          <span className="mt-0.5">
            <NotificationIcon type={item.type} />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-sm",
                !item.read && "font-medium"
              )}
            >
              {item.title}
            </span>
            <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
              {item.message}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground/70">
              {formatRelativeTime(item.createdAt, now)}
            </span>
          </span>
          {!item.read ? (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          ) : null}
        </button>
      ))}
    </div>
  )
}

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-destructive-foreground tabular-nums"
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}

function useNotificationCenter(user: User) {
  const [open, setOpen] = React.useState(false)
  const { items, unreadCount, loading, markAllRead, markRead } =
    useNotifications()
  const now = useNow()
  const router = useRouter()

  const handleSelect = React.useCallback(
    (item: NotificationItem) => {
      if (!item.read) void markRead(item.id)
      setOpen(false)
      if (item.link) router.push(item.link)
    },
    [markRead, router]
  )

  return {
    open,
    setOpen,
    items,
    unreadCount,
    loading,
    now,
    markAllRead,
    handleSelect,
    rolePath: `/${user.role.toLowerCase()}`,
  }
}

function NotificationsDropdown({
  state,
}: {
  state: ReturnType<typeof useNotificationCenter>
}) {
  return (
    <DropdownMenu open={state.open} onOpenChange={state.setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={
            state.unreadCount > 0
              ? `Notifications (${state.unreadCount} unread)`
              : "Notifications"
          }
        >
          <Bell className="size-4" />
          <UnreadBadge count={state.unreadCount} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-medium">
            Notifications
          </DropdownMenuLabel>
          {state.unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={state.markAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-96 overflow-y-auto">
          <NotificationList
            items={state.items}
            loading={state.loading}
            now={state.now}
            onSelect={state.handleSelect}
          />
        </div>
        {state.items.length > MAX_VISIBLE ? (
          <>
            <DropdownMenuSeparator className="my-0" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                asChild
                className="justify-center rounded-none py-2 text-sm"
              >
                <Link href={`${state.rolePath}/notifications`}>
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationsSheet({
  state,
}: {
  state: ReturnType<typeof useNotificationCenter>
}) {
  return (
    <Sheet open={state.open} onOpenChange={state.setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={
            state.unreadCount > 0
              ? `Notifications (${state.unreadCount} unread)`
              : "Notifications"
          }
        >
          <Bell />
          <UnreadBadge count={state.unreadCount} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">Notifications</SheetTitle>
          {state.unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={state.markAllRead}
            >
              Mark all read
            </Button>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <NotificationList
            items={state.items}
            loading={state.loading}
            now={state.now}
            onSelect={state.handleSelect}
          />
        </div>
        {state.items.length > MAX_VISIBLE ? (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-center text-sm"
              asChild
            >
              <Link href={`${state.rolePath}/notifications`}>
                View all notifications
              </Link>
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/**
 * Notification centre. Renders a dropdown on desktop and a sheet on mobile —
 * two separate components, because a menu nested inside a sheet cannot be
 * dismissed by the sheet's own overlay and leaves focus trapped.
 */
export function Notifications({ user }: { user: User }) {
  const state = useNotificationCenter(user)
  const isDesktop = useIsDesktop()

  return isDesktop ? (
    <NotificationsDropdown state={state} />
  ) : (
    <NotificationsSheet state={state} />
  )
}
