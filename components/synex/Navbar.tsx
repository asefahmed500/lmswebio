"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

/**
 * Public marketing navigation.
 *
 * Every entry here resolves to a real route or a real in-page section. An
 * earlier version linked to /about, /blog, /careers, /contact, /docs, /help,
 * /community, /api-reference, /changelog and /cookie-policy, none of which
 * exist, and pointed a link labelled "Enterprise" at a section that no longer
 * advertised enterprise features.
 *
 * Controls follow the project scale: 36px height, 14px type, 6px radius. The
 * pill-shaped CTAs (`rounded-[9999px]`) were removed to match the rest of the
 * product.
 */

const NAV_LINKS = [
  { label: "Courses", href: "/courses" },
  { label: "Features", href: "#enterprise" },
  { label: "Pricing", href: "#pricing-info" },
  { label: "Try it", href: "#try-it" },
] as const

export function SynexNavbar() {
  const { isAuthenticated, user } = useAuth()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  function getDashboardHref(): string {
    if (!user) return "/login"
    switch (user.role) {
      case "ADMIN":
        return "/admin"
      case "INSTRUCTOR":
        return "/instructor"
      case "STUDENT":
        return "/student"
      default:
        return "/login"
    }
  }

  const close = () => setMobileOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <span className="text-xs font-medium">L</span>
          </span>
          <span className="text-lg tracking-tight text-foreground">LMSio</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button asChild>
              <Link href={getDashboardHref()}>
                Go to dashboard
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  Create account
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="-mr-1 md:hidden"
        >
          {mobileOpen ? <X data-icon /> : <Menu data-icon />}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="bg-background md:hidden">
          <Separator />
          <div className="mx-auto max-w-7xl px-5 py-3">
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  className="h-10 w-full justify-start font-normal"
                >
                  <Link href={link.href} onClick={close}>
                    {link.label}
                  </Link>
                </Button>
              ))}
            </nav>

            <Separator className="my-3" />

            {isAuthenticated ? (
              <Button asChild className="w-full">
                <Link href={getDashboardHref()} onClick={close}>
                  Go to dashboard
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={close}>
                    Log in
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register" onClick={close}>
                    Create account
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  )
}
