"use client"

import * as React from "react"

import type { User } from "@/types"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandPalette } from "@/features/dashboard/components/command-palette"
import { Notifications } from "@/features/dashboard/layout/notifications"
import { UserMenu } from "@/features/dashboard/layout/user-menu"

interface DashboardHeaderProps {
  user: User
}

/**
 * Application header for the dashboard shell.
 *
 * Previously this file was 417 lines and owned the account menu, the
 * notification centre, and two near-identical search forms — one of which
 * routed to `/admin/courses`, another to `/instructor/courses`, and a third in
 * the sidebar to `/student/courses/catalogue`. All of that now lives in
 * dedicated components, and search is a single command palette driven by the
 * same `nav/config.ts` the sidebar uses.
 */
export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div className="flex h-14 items-center gap-2 px-4 sm:gap-3 md:px-6">
        <SidebarTrigger className="-ml-1 shrink-0" />

        <div className="flex min-w-0 flex-1 items-center">
          <CommandPalette role={user.role} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Notifications user={user} />
          <Separator
            orientation="vertical"
            className="mx-1 hidden h-5 sm:block"
          />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
