"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react"

import type { User as UserType } from "@/types"
import { useAuth } from "@/components/auth-provider"
import { LogoMark } from "@/components/homepage/lmsio-logo"
import { useHydrated } from "@/hooks/use-media-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function ThemeMenuItems() {
  const { theme, setTheme } = useTheme()
  // The server has no theme value. Deferring the current-theme indicator until
  // hydration avoids a server/client markup mismatch.
  const hydrated = useHydrated()

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const

  return (
    <DropdownMenuGroup>
      {options.map(({ value, label, icon: Icon }) => {
        const selected = hydrated && theme === value
        return (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon className="text-muted-foreground" />
            <span className="flex-1">{label}</span>
            {selected ? (
              <>
                <span
                  className="size-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="sr-only">Current</span>
              </>
            ) : null}
          </DropdownMenuItem>
        )
      })}
    </DropdownMenuGroup>
  )
}

/** Account menu for the app shell: one separator per group, no stray items. */
export function UserMenu({ user }: { user: UserType }) {
  const { logout } = useAuth()
  const rolePath = `/${user.role.toLowerCase()}`

  const handleLogout = React.useCallback(async () => {
    await logout()
    window.location.href = "/login"
  }, [logout])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="size-9 rounded-full p-0"
          aria-label={`Account menu for ${user.fullName}`}
        >
          <Avatar className="size-9">
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback className="p-0">
              <LogoMark className="size-full rounded-full" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={user.avatarUrl} alt="" />
              <AvatarFallback className="p-0">
                <LogoMark className="size-full rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm leading-tight font-medium">
                {user.fullName}
              </p>
              <p className="truncate text-xs leading-tight text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`${rolePath}/profile`}>
              <User className="text-muted-foreground" />
              Profile
            </Link>
          </DropdownMenuItem>
          {user.role === "ADMIN" ? (
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings className="text-muted-foreground" />
                Account settings
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <ThemeMenuItems />

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
