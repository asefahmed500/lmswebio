/**
 * Dashboard layout shell component
 * Provides the sidebar and header layout for dashboard pages
 * Fully responsive with mobile navigation support
 */

"use client"

import * as React from "react"
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
import { useMediaQuery, Breakpoint } from "@/lib/utils/responsive"

/**
 * Dashboard layout shell component
 * Wraps dashboard pages with sidebar and header
 * Mobile-first responsive design with bottom navigation
 */
export function DashboardLayoutShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const isMobile = useMediaQuery("md" as Breakpoint)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      window.location.href = "/login"
    }
  }, [user])

  if (!user) {
    return null // Will redirect
  }

  // Get user initials for avatar
  const initials = React.useMemo(() => {
    return user.fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [user.fullName])

  // Handle logout
  const handleLogout = React.useCallback(() => {
    logout()
    window.location.href = "/login"
  }, [logout])

  // On mobile, use bottom navigation instead of sidebar
  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        {/* Mobile header */}
        <DashboardHeader user={user} />
        <Separator />

        {/* Main content with padding for bottom nav */}
        <main className="flex-1 pb-16">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <MobileNav
          userRole={user.role as Role}
          user={user}
          onLogout={handleLogout}
        />
      </div>
    )
  }

  // Desktop/tablet layout with sidebar
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                L
              </div>
              <span className="group-data-[collapsible=icon]:hidden">
                LMS Platform
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav role={user.role as Role} />
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuButton asChild size="default">
                <a
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
                </a>
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
    </SidebarProvider>
  )
}
