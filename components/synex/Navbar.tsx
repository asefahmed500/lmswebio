"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"

import { useAuth } from "@/components/auth-provider"

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
    <nav className="sticky top-0 z-50 border-b border-graphite/10 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-sm bg-void-black">
            <span className="font-visueltpro text-xs font-bold text-chalk">
              L
            </span>
          </span>
          <span className="font-visueltpro text-lg tracking-[-0.02em] text-void-black">
            LMSio
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-visueltpro text-sm text-graphite transition-colors hover:text-void-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              href={getDashboardHref()}
              className="inline-flex h-9 items-center rounded-md bg-void-black px-3 font-visueltpro text-sm font-medium text-chalk transition-colors hover:bg-graphite"
            >
              Go to dashboard
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="font-visueltpro text-sm text-graphite transition-colors hover:text-void-black"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-md bg-void-black px-3 font-visueltpro text-sm font-medium text-chalk transition-colors hover:bg-graphite"
              >
                Create account
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-md md:hidden"
        >
          {mobileOpen ? (
            <X className="size-5 text-graphite" />
          ) : (
            <Menu className="size-5 text-graphite" />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-graphite/10 bg-canvas md:hidden">
          <div className="mx-auto max-w-[1280px] px-5 py-3">
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-md px-2 py-2.5 font-visueltpro text-sm text-graphite transition-colors hover:bg-linen hover:text-void-black"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="my-3 border-t border-graphite/10" />

            {isAuthenticated ? (
              <Link
                href={getDashboardHref()}
                onClick={close}
                className="flex h-9 items-center justify-center rounded-md bg-void-black px-3 font-visueltpro text-sm font-medium text-chalk"
              >
                Go to dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={close}
                  className="flex h-9 items-center justify-center rounded-md border border-graphite/15 font-visueltpro text-sm text-graphite"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="flex h-9 items-center justify-center rounded-md bg-void-black font-visueltpro text-sm font-medium text-chalk"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  )
}
