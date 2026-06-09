"use client"

import React, { useState } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export function SynexNavbar() {
  const { isAuthenticated, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

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

  return (
    <nav className="sticky top-0 z-50 border-b border-graphite/10 bg-canvas/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-sm bg-void-black">
            <span className="font-visueltpro text-xs font-bold text-chalk">
              L
            </span>
          </div>
          <span className="font-visueltpro text-lg font-normal tracking-[-0.02em] text-void-black">
            LMSio
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: "Courses", href: "/courses" },
            { label: "Pricing", href: "#pricing-info" },
            { label: "Enterprise", href: "#" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-visueltpro text-sm font-light text-graphite transition-colors hover:text-void-black"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href={getDashboardHref()}
                className="font-visueltpro text-sm font-light text-graphite transition-colors hover:text-void-black"
              >
                Dashboard
              </Link>
              <Link
                href={getDashboardHref()}
                className="rounded-[9999px] bg-void-black px-5 py-2 font-visueltpro text-sm font-medium text-chalk"
              >
                Go to app
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-visueltpro text-sm font-light text-graphite transition-colors hover:text-void-black"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-[9999px] bg-void-black px-5 py-2 font-visueltpro text-sm font-medium text-chalk"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="flex items-center justify-center md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="size-5 text-graphite" />
          ) : (
            <Menu className="size-5 text-graphite" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-graphite/10 bg-canvas md:hidden">
          <div className="mx-auto max-w-[1280px] px-5 py-4">
            <div className="flex flex-col gap-3">
              {[
                { label: "Courses", href: "/courses" },
                { label: "Pricing", href: "#pricing-info" },
                { label: "Enterprise", href: "#" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 font-visueltpro text-sm font-light text-graphite transition-colors hover:text-void-black"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-graphite/10" />
              {isAuthenticated ? (
                <Link
                  href={getDashboardHref()}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[9999px] bg-void-black px-5 py-2.5 text-center font-visueltpro text-sm font-medium text-chalk"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 font-visueltpro text-sm font-light text-graphite"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-[9999px] bg-void-black px-5 py-2.5 text-center font-visueltpro text-sm font-medium text-chalk"
                  >
                    Get started <ArrowRight className="inline size-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
