"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import type { Role } from "@/types"
import { getNavConfig } from "@/features/dashboard/nav/config"
import { isNavItemActive } from "@/features/dashboard/nav/active"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

/**
 * Top bar for viewports below the shell breakpoint.
 *
 * The previous implementation was 471 lines and carried its own copy of the
 * navigation tree, so a new section had to be added in two places. It now
 * reads the same `nav/config.ts` as the desktop sidebar and shows the four
 * highest-priority destinations, with the full tree one tap away in a sheet.
 */

const MAX_QUICK_ACTIONS = 4

export function MobileNav({
  role,
  onLogout,
}: {
  role: Role
  onLogout: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const config = React.useMemo(() => getNavConfig(role), [role])

  // Quick actions: the dashboard, then the first leaf of each of the first few
  // sections. Falls back sensibly for roles with many sections.
  const quickActions = React.useMemo(() => {
    const picks = [...config.primary]
    for (const section of config.sections) {
      if (picks.length >= MAX_QUICK_ACTIONS) break
      const first = section.items[0]
      if (first) picks.push(first)
    }
    for (const item of config.secondary) {
      if (picks.length >= MAX_QUICK_ACTIONS) break
      picks.push(item)
    }
    return picks.slice(0, MAX_QUICK_ACTIONS)
  }, [config])

  const allItems = React.useMemo(
    () => [
      ...config.primary.map((i) => ({ ...i, group: "Overview" })),
      ...config.sections.flatMap((s) =>
        s.items.map((i) => ({ ...i, group: s.title }))
      ),
      ...config.secondary.map((i) => ({ ...i, group: "Account" })),
    ],
    [config]
  )

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof allItems>()
    for (const entry of allItems) {
      const list = map.get(entry.group) ?? []
      list.push(entry)
      map.set(entry.group, list)
    }
    return Array.from(map.entries())
  }, [allItems])

  const close = () => setOpen(false)

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      >
        <ul className="grid grid-cols-5">
          {quickActions.slice(0, 4).map((item) => {
            const active = isNavItemActive(pathname, item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="max-w-full truncate px-1">{item.title}</span>
                </Link>
              </li>
            )
          })}

          <li>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-none text-[11px] font-medium text-muted-foreground"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" />
                  <span>More</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="max-h-[85svh] p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <ScrollArea className="h-full max-h-[85svh]">
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-sm font-semibold">All sections</p>
                  </div>
                  <Separator />
                  <div className="px-2 py-2">
                    {grouped.map(([group, items]) => (
                      <div key={group} className="mb-3 last:mb-0">
                        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          {group}
                        </p>
                        <ul>
                          {items.map((item) => {
                            const active = isNavItemActive(pathname, item.href)
                            const Icon = item.icon
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={close}
                                  aria-current={active ? "page" : undefined}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                    active
                                      ? "bg-primary/10 font-medium text-primary"
                                      : "text-foreground hover:bg-accent"
                                  )}
                                >
                                  <Icon className="size-4 shrink-0" />
                                  {item.title}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}

                    <Separator className="my-2" />
                    <ul>
                      <li>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            close()
                            onLogout()
                          }}
                          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Log out
                        </Button>
                      </li>
                    </ul>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  )
}
