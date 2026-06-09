/**
 * LMSio Logo Component
 *
 * Unique branded logo with uniform text sizing.
 * Modern gradient design with platform initials.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"

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
        "flex items-center gap-2 transition-opacity hover:opacity-80",
        className
      )}
    >
      {/* Logo Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg">
        <div className="relative flex h-10 w-10 items-center justify-center">
          {/* Outer Shape */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-500 shadow-lg" />

          {/* Inner Layer */}
          <div className="absolute inset-[2px] rounded-[10px] bg-background/10 backdrop-blur-sm" />

          {/* LMS Symbol */}
          <div className="relative flex items-end gap-0.5">
            <div className="h-3 w-1 rounded-full bg-white" />
            <div className="h-5 w-1 rounded-full bg-white" />
            <div className="h-7 w-1 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* Text - All Same Size */}
      {variant !== "icon" && (
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-primary">
            lmsio
          </span>
          {showTagline && variant === "default" && (
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              LEARN MORE
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

/**
 * Compact Logo for Small Spaces
 */
export function LMSioLogoCompact({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 transition-opacity hover:opacity-80",
        className
      )}
    >
      {/* Compact Icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        L
      </div>

      {/* Compact Text */}
      <span className="text-lg font-bold tracking-tight text-primary">
        LMSio
      </span>
    </Link>
  )
}

/**
 * Icon-Only Logo for Very Small Spaces
 */
export function LMSioLogoIcon({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex transition-opacity hover:opacity-80", className)}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-lg">
        L
      </div>
    </Link>
  )
}

/**
 * Horizontal Logo for Footer
 */
export function LMSioLogoHorizontal({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-3 transition-opacity hover:opacity-80",
        className
      )}
    >
      {/* Logo Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg">
        <div className="relative flex h-10 w-10 items-center justify-center">
          {/* Outer Shape */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-500 shadow-lg" />

          {/* Inner Layer */}
          <div className="absolute inset-[2px] rounded-[10px] bg-background/10 backdrop-blur-sm" />

          {/* LMS Symbol */}
          <div className="relative flex items-end gap-0.5">
            <div className="h-3 w-1 rounded-full bg-white" />
            <div className="h-5 w-1 rounded-full bg-white" />
            <div className="h-7 w-1 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* Text with Tagline */}
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-tight text-primary">
          LMSio
        </span>
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          Modern Learning Platform
        </span>
      </div>
    </Link>
  )
}
