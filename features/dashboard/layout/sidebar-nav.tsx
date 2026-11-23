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
import { sidebarMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
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
    >
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(isSub && "pl-2")}
      >
        <Icon />
        <span className="truncate">{item.title}</span>
        {item.badge ? (
          <span className="ml-auto text-xs tabular-nums opacity-70">
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
            className="font-medium"
          >
            <Icon />
            <span className="truncate">{section.title}</span>
            <SidebarMenuBadge>
              <ChevronDown
                className={cn(sidebarMotion.chevron, open && "rotate-180")}
              />
            </SidebarMenuBadge>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className={sidebarMotion.group}>
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
