"use client"

import * as React from "react"
import Link from "next/link"

import type { Role, User } from "@/types"
import { useAuth } from "@/components/auth-provider"
import { useIsDesktop } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/features/dashboard/layout/dashboard-header"
import { SidebarNav } from "@/features/dashboard/layout/sidebar-nav"
import { MobileNav } from "@/features/dashboard/layout/mobile-nav"
import { getInitials } from "@/features/dashboard/layout/user-menu"

/**
 * Breakpoint for the sidebar/mobile-nav switch.
 *
 * The layout, the header, and the notification centre each used to branch on
 * their own `useMediaQuery` call with a duplicated literal, so the switch could
 * disagree between components. Every branch now reads the shared
 * `useIsDesktop` hook, which is backed by `useSyncExternalStore`.
 */

function LoadingShell() {
  return (
    <div
      className="flex min-h-svh items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Loading your workspace…</p>
      </div>
    </div>
  )
}

function MobileShell({
  user,
  children,
  onLogout,
}: {
  user: User
  children: React.ReactNode
  onLogout: () => void
}) {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <DashboardHeader user={user} />
      <Separator />
      <main id="main-content" className="flex-1 p-4 pb-24 sm:p-5">
        {children}
      </main>
      <MobileNav role={user.role as Role} onLogout={onLogout} />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const isDesktop = useIsDesktop()

  const handleLogout = React.useCallback(async () => {
    await logout()
    window.location.href = "/login"
  }, [logout])

  React.useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/login"
    }
  }, [user, isLoading])

  if (isLoading) return <LoadingShell />
  if (!user) return null

  return (
    // SidebarProvider wraps BOTH branches. The header always renders
    // <SidebarTrigger>, which calls useSidebar() and throws without this
    // context — previously only the desktop branch had a provider, so every
    // dashboard page threw below the 768px breakpoint.
    <SidebarProvider>
      {isDesktop ? (
        <DesktopShell user={user} onLogout={handleLogout}>
          {children}
        </DesktopShell>
      ) : (
        <MobileShell user={user} onLogout={handleLogout}>
          {children}
        </MobileShell>
      )}
    </SidebarProvider>
  )
}

function DesktopShell({
  user,
  children,
  onLogout,
}: {
  user: User
  children: React.ReactNode
  onLogout: () => void
}) {
  const initials = getInitials(user.fullName)
  const basePath = `/${user.role.toLowerCase()}`

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border p-3">
            <Link
              href={basePath}
              className="flex items-center gap-2.5 rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                L
              </span>
              <span className="truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                LMSio
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="py-2">
            <SidebarNav role={user.role as Role} onLogout={onLogout} />
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="default"
                  tooltip={user.fullName}
                >
                  <Link href={`${basePath}/profile`}>
                    <Avatar className="size-5">
                      <AvatarFallback className="text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      {user.fullName}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0">
          <DashboardHeader user={user} />
          <Separator />
          <main id="main-content" className={cn("flex-1 p-4 sm:p-5 lg:p-6")}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </TooltipProvider>
  )
}

/** Back-compat alias for the previous export name. */
export const DashboardLayoutShell = AppShell
