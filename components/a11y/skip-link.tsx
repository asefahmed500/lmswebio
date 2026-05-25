"use client"

import * as React from "react"
import Link from "next/link"

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * SkipLink component for accessibility
 * Allows keyboard users to skip repetitive navigation
 */
export function SkipLink({ href, children, className = "" }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
        bg-primary text-primary-foreground px-4 py-2 rounded-md
        z-50 focus:outline-none focus:ring-2 focus:ring-ring
        transition-all
        ${className}
      `}
    >
      {children}
    </Link>
  )
}

interface SkipLinksProps {
  links: {
    href: string
    label: string
  }[]
}

/**
 * Multiple skip links for different sections
 */
export function SkipLinks({ links }: SkipLinksProps) {
  return (
    <div className="sr-only focus:not-sr-only">
      {links.map((link) => (
        <SkipLink key={link.href} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  )
}
