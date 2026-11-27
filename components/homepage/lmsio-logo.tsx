/**
 * LMSio brand mark.
 *
 * A single reusable, dependency-free SVG: an open book whose pages form a
 * quiet "L". No gradients, no bold text — it inherits semantic colours so it
 * works on light/dark surfaces and at any size.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden="true"
      >
        <path d="M4 8.5c4-1.6 8-1.6 12 0v14c-4-1.6-8-1.6-12 0z" />
        <path d="M28 8.5c-4-1.6-8-1.6-12 0v14c4-1.6 8-1.6 12 0z" />
        <path d="M10 5.5v17" />
      </svg>
    </span>
  )
}

interface LogoProps {
  className?: string
  showTagline?: boolean
  variant?: "default" | "compact" | "icon"
}

export function LMSioLogo({
  className,
  showTagline = false,
  variant = "default",
}: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2.5 rounded-md outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <LogoMark />
      {variant !== "icon" && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-medium tracking-tight text-foreground">
            lmsio
          </span>
          {showTagline && variant === "default" && (
            <span className="mt-1 text-[11px] font-normal tracking-wide text-muted-foreground">
              Learn without limits
            </span>
          )}
        </span>
      )}
    </Link>
  )
}

export function LMSioLogoCompact({ className }: { className?: string }) {
  return <LMSioLogo className={className} variant="compact" />
}

export function LMSioLogoIcon({ className }: { className?: string }) {
  return <LMSioLogo className={className} variant="icon" />
}

export function LMSioLogoHorizontal({ className }: { className?: string }) {
  return <LMSioLogo className={className} showTagline />
}
