"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut } from "lucide-react"

import type { Role } from "@/types"
import type { NavItem, NavSection } from "@/features/dashboard/nav/config"
import { getNavConfig } from "@/features/dashboard/nav/config"
import {
  hasActiveDescendant,
  isNavItemActive,
} from "@/features/dashboard/nav/active"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

function NavLink({ item, isSub = false }: { item: NavItem; isSub?: boolean }) {
  const pathname = usePathname()
  const active = isNavItemActive(pathname, item.href)
  const Icon = item.icon

  const Button = isSub ? SidebarMenuSubButton : SidebarMenuButton

  return (
    <Button
      asChild
      isActive={active}
      tooltip={isSub ? undefined : item.title}
      data-nav-item={item.href}
      className={cn(
        // A quiet rail makes the current section scannable without colour.
        !isSub &&
          "before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:opacity-0 data-[active=true]:before:opacity-100",
        isSub && "data-[active=true]:text-primary"
      )}
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(isSub && "pl-2")}
      >
        <Icon />
        <span className="truncate">{item.title}</span>
        {item.badge ? (
          <span className="ml-auto shrink-0 rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[11px] text-sidebar-foreground tabular-nums">
            {item.badge}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}

/**
 * A collapsible group of child routes.
 *
 * The open state is derived from the current route and can be overridden by an
 * explicit user toggle. Previously this was `useState(hasActiveSubItem)`, whose
 * initializer only runs on mount — so a group stayed shut when the user
 * navigated into it from another page.
 */
function NavSectionGroup({ section }: { section: NavSection }) {
  const pathname = usePathname()
  const hrefs = React.useMemo(
    () => section.items.map((item) => item.href),
    [section.items]
  )
  const groupActive = hasActiveDescendant(pathname, hrefs)
  const Icon = section.icon

  // The user can collapse a group, but navigating into it should re-open it.
  // The override is stored alongside the route it was made on and discarded
  // whenever the route changes — React's "adjust state during render" pattern,
  // which avoids the extra render pass an effect would cause.
  const [override, setOverride] = React.useState<{
    route: string
    open: boolean | null
  }>({ route: pathname, open: null })

  if (override.route !== pathname) {
    setOverride({ route: pathname, open: null })
  }

  const open = override.open ?? groupActive
  const handleOpenChange = React.useCallback(
    (next: boolean) => setOverride({ route: pathname, open: next }),
    [pathname]
  )

  return (
    <Collapsible asChild open={open} onOpenChange={handleOpenChange}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={section.title}
            isActive={groupActive}
            className={cn(
              "font-medium before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:opacity-0 data-[active=true]:before:opacity-100"
            )}
          >
            <Icon />
            <span className="truncate">{section.title}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[collapsible=icon]:hidden",
                open && "rotate-180"
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {section.items.map((item) => (
              <SidebarMenuSubItem key={item.href}>
                <NavLink item={item} isSub />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function SidebarNav({
  role,
  onLogout,
}: {
  role: Role
  onLogout: () => void
}) {
  const config = getNavConfig(role)
  const hasMultipleSections = config.sections.length > 1

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {config.primary.map((item) => (
            <SidebarMenuItem key={item.href}>
              <NavLink item={item} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {config.sections.length > 0 && (
        <SidebarGroup>
          {hasMultipleSections && (
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarMenu>
            {config.sections.map((section) => (
              <NavSectionGroup key={section.title} section={section} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}

      {config.secondary.length > 0 && (
        <SidebarGroup>
          <SidebarMenu>
            {config.secondary.map((item) => (
              <SidebarMenuItem key={item.href}>
                <NavLink item={item} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={onLogout}
            tooltip="Log out"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/40"
          >
            <LogOut />
            <span className="group-data-[collapsible=icon]:hidden">
              Log out
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
