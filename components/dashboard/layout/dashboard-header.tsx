"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bell,
  Search,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-provider"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useMediaQuery, Breakpoint } from "@/lib/utils/responsive"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { apiGet, apiPatch } from "@/lib/api-client"

interface DashboardHeaderProps {
  user: User
}

function UserMenu({ user }: { user: User }) {
  const { setTheme, theme } = useTheme()
  const { logout } = useAuth()
  const isMobile = useMediaQuery("md" as Breakpoint)

  const initials = React.useMemo(() => {
    return user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [user.fullName])

  const rolePath = `/${user.role.toLowerCase()}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative rounded-full",
            isMobile ? "h-11 w-11" : "h-9 w-9"
          )}
          aria-label="User menu"
        >
          <Avatar className={cn(isMobile ? "h-11 w-11" : "h-9 w-9")}>
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-none font-medium">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="mt-1 text-xs leading-none text-muted-foreground capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`${rolePath}/profile`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          Toggle {theme === "dark" ? "Light" : "Dark"} Mode
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout()
            window.location.href = "/login"
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NotificationItem {
  id: number
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  createdAt: string
}

function Notifications({ user }: { user: User }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    []
  )
  const [unreadCount, setUnreadCount] = React.useState(0)
  const isMobile = useMediaQuery("md" as Breakpoint)
  const rolePath = `/${user.role.toLowerCase()}`

  React.useEffect(() => {
    async function loadNotifications() {
      const result = await apiGet<{
        notifications: NotificationItem[]
        unreadCount: number
      }>("/notifications")
      if (result.data) {
        setNotifications(result.data.notifications || [])
        setUnreadCount(result.data.unreadCount || 0)
      }
    }
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
    await apiPatch("/notifications", { markAll: true })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = async (id: number) => {
    const res = await apiPatch("/notifications", {
      notificationIds: [id],
      read: true,
    })
    if (!res.error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
  }

  const [nowRef] = React.useState(() => Date.now())

  const timeAgo = (dateStr: string) => {
    const diff = nowRef - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "Just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-success size-4 shrink-0" />
      case "warning":
        return <AlertTriangle className="text-warning size-4 shrink-0" />
      case "error":
        return <XCircle className="size-4 shrink-0 text-destructive" />
      default:
        return <Info className="text-info size-4 shrink-0" />
    }
  }

  const notifList = (
    <div className="flex flex-col gap-1">
      {notifications.length > 0 ? (
        notifications.slice(0, 10).map((n) => (
          <Button
            type="button"
            key={n.id}
            variant="ghost"
            className={cn(
              "flex h-auto w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent",
              !n.read && "bg-primary/5"
            )}
            onClick={() => {
              if (!n.read) markRead(n.id)
              if (n.link) window.location.href = n.link
            }}
          >
            <div className="mt-0.5">{getNotifIcon(n.type)}</div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", !n.read && "font-medium")}>
                {n.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {n.message}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {timeAgo(n.createdAt)}
              </p>
            </div>
            {!n.read && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            )}
          </Button>
        ))
      ) : (
        <div className="py-8 text-center">
          <Bell className="mx-auto mb-2 size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No notifications</p>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
              >
                <X />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">{notifList}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto p-1">{notifList}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer justify-center">
          <Link href={`${rolePath}/notifications`}>View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchExpanded, setSearchExpanded] = React.useState(false)
  const isMobile = !useMediaQuery("md" as Breakpoint)
  const isTablet = !useMediaQuery("lg" as Breakpoint)
  const rolePath = `/${user.role.toLowerCase()}`

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    if (isMobile) setSearchExpanded(false)
    window.location.href = `${rolePath}/courses?search=${encodeURIComponent(searchQuery.trim())}`
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        className={cn(
          "flex items-center gap-2 px-4 sm:gap-4 md:px-6",
          isMobile ? "h-14" : "h-14"
        )}
      >
        {!isMobile && <SidebarTrigger className="-ml-1 shrink-0" />}

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchExpanded(!searchExpanded)}
            aria-label="Toggle search"
            aria-expanded={searchExpanded}
          >
            <Search />
          </Button>
        )}

        {isMobile && searchExpanded && (
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="h-10 bg-muted/50 pr-10 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                onClick={() => {
                  setSearchExpanded(false)
                  setSearchQuery("")
                }}
                aria-label="Clear search"
              >
                <X />
              </Button>
            </div>
          </form>
        )}

        {!isMobile && (
          <form
            onSubmit={handleSearch}
            className={cn("flex-1", isTablet ? "max-w-xs" : "max-w-md")}
          >
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={
                  isTablet
                    ? "Search..."
                    : "Search courses, assignments, students..."
                }
                className="bg-muted/50 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        )}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Notifications user={user} />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
