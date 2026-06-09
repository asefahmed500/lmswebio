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
      className={`sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-all focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:ring-2 focus:ring-ring focus:outline-none ${className} `}
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
