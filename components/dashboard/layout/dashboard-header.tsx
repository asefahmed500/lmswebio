/**
 * Dashboard header component
 * Displays user info, notifications, theme toggle, and mobile menu trigger
 * Fully responsive with mobile-optimized layout
 */

"use client"

import * as React from "react"
import { Bell, Search, X } from "lucide-react"
import { useTheme } from "next-themes"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  user: User
}

function UserMenu({ user }: { user: User }) {
  const { setTheme, theme } = useTheme()
  const isMobile = useMediaQuery("md" as Breakpoint)

  const initials = React.useMemo(() => {
    return user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [user.fullName])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("relative rounded-full", isMobile ? "h-11 w-11" : "h-9 w-9")}
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
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs leading-none text-muted-foreground">{user.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`/${user.role.toLowerCase()}/profile`}>Profile</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/${user.role.toLowerCase()}/settings`}>Settings</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          Toggle {theme === "dark" ? "Light" : "Dark"} Mode
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/login" className="text-destructive focus:text-destructive">Log out</a>
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
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const isMobile = useMediaQuery("md" as Breakpoint)

  React.useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      } catch {}
    }
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = (id: number) => {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [id], read: true }),
    })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "Just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const notifList = (
    <>
      {notifications.length > 0 ? (
        notifications.slice(0, 10).map((n) => (
          <div
            key={n.id}
            className={cn(
              "p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer",
              !n.read && "bg-primary/5 border border-primary/20"
            )}
            onClick={() => {
              if (!n.read) markRead(n.id)
              if (n.link) window.location.href = n.link
            }}
          >
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
          </div>
        ))
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No notifications</p>
      )}
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-11 w-11"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">{notifList}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto space-y-1 p-1">{notifList}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer justify-center">
          <a href={`/${user.role.toLowerCase()}/notifications`}>View all notifications</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchExpanded, setSearchExpanded] = React.useState(false)
  const isMobile = useMediaQuery("md" as Breakpoint)
  const isTablet = useMediaQuery("lg" as Breakpoint)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/api/search?q=${encodeURIComponent(searchQuery)}`
    }
    if (isMobile) setSearchExpanded(false)
  }

  return (
    <header className={cn("sticky top-0 z-10 w-full border-b bg-background", isMobile && "pb-safe")}>
      <div className={cn("flex items-center gap-2 sm:gap-4 px-2 sm:px-4 md:px-6", isMobile ? "h-14" : "h-16")}>
        {!isMobile && <SidebarTrigger className="-ml-1" />}

        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setSearchExpanded(!searchExpanded)}
            aria-label="Toggle search" aria-expanded={searchExpanded}>
            <Search className="h-5 w-5" />
          </Button>
        )}

        {isMobile && searchExpanded && (
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="bg-muted/50 pl-9 pr-10 h-10"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
              <Button type="button" variant="ghost" size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7"
                onClick={() => { setSearchExpanded(false); setSearchQuery("") }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {!isMobile && (
          <form onSubmit={handleSearch} className={cn("flex-1", isTablet ? "max-w-xs" : "max-w-md")}>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search"
                placeholder={isTablet ? "Search..." : "Search courses, assignments, students..."}
                className="bg-muted/50 pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </form>
        )}

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <Notifications user={user} />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
