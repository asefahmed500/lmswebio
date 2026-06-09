"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import type { Role } from "@/types"
import { DashboardHeader } from "./dashboard-header"
import { SidebarNav } from "./sidebar-nav"
import { MobileNav } from "@/components/mobile/mobile-nav"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useMediaQuery, Breakpoint } from "@/lib/utils/responsive"

export function DashboardLayoutShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, logout } = useAuth()
  const isMobile = !useMediaQuery("md" as Breakpoint)

  const initials = React.useMemo(() => {
    if (!user) return ""
    return user.fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [user?.fullName])

  const handleLogout = React.useCallback(() => {
    logout()
    window.location.href = "/login"
  }, [logout])

  React.useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/login"
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <DashboardHeader user={user} />
        <Separator />
        <main className="flex-1 p-4 pb-20" id="main-content">
          {children}
        </main>
        <MobileNav
          userRole={user.role as Role}
          user={user}
          onLogout={handleLogout}
        />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={0}>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon">
            <SidebarHeader className="border-b p-4">
              <Link
                href={`/${user.role.toLowerCase()}`}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  L
                </div>
                <span className="group-data-[collapsible=icon]:hidden">
                  LMSio
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarNav role={user.role as Role} />
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuButton asChild size="default">
                  <Link
                    href={`/${user.role.toLowerCase()}/profile`}
                    className="focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Go to ${user.fullName}'s profile`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs" aria-hidden="true">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="group-data-[collapsible=icon]:hidden">
                      {user.fullName}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <DashboardHeader user={user} />
            <Separator />
            <main className="flex-1 p-4 md:p-6 lg:p-8" id="main-content">
              {children}
            </main>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  )
}
