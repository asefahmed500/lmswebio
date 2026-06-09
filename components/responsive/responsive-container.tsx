"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  padding?: boolean
}

/**
 * Responsive container component
 * Provides consistent responsive widths across the application
 */
export function ResponsiveContainer({
  children,
  className = "",
  maxWidth = "lg",
  padding = false,
}: ResponsiveContainerProps) {
  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  }

  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidths[maxWidth],
        padding && "px-4 md:px-6",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Mobile-first stack component
 * Stacks children vertically on mobile, horizontally on desktop
 */
interface StackProps {
  children: React.ReactNode
  direction?: "row" | "col"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around"
  gap?: number
  className?: string
}

export function Stack({
  children,
  direction = "col",
  align = "start",
  justify = "start",
  gap = 4,
  className = "",
}: StackProps) {
  const isRow = direction === "row"

  return (
    <div
      className={cn(
        "flex",
        isRow ? "flex-row" : "flex-col",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        justify === "center" && "justify-center",
        justify === "end" && "justify-end",
        justify === "between" && "justify-between",
        justify === "around" && "justify-around",
        isRow ? "flex-wrap" : "",
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Grid component with responsive columns
 */
interface GridProps {
  children: React.ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: number
  className?: string
}

export function Grid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = "",
}: GridProps) {
  const gridCols = cols.mobile
    ? `grid-cols-${cols.mobile} md:grid-cols-${cols.tablet || cols.mobile} lg:grid-cols-${cols.desktop || cols.tablet || cols.mobile}`
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

  return (
    <div className={cn("grid", gridCols, `gap-${gap}`, className)}>
      {children}
    </div>
  )
}

/**
 * Hide component on specific breakpoints
 */
interface HideProps {
  children: React.ReactNode
  below?: "md" | "lg" | "xl"
  above?: "sm" | "md" | "lg"
}

export function Hide({ children, below, above }: HideProps) {
  if (below) {
    return (
      <div
        className={cn(
          "hidden",
          below === "md" && "md:hidden",
          below === "lg" && "lg:hidden",
          below === "xl" && "xl:hidden"
        )}
      >
        {children}
      </div>
    )
  }
  if (above) {
    return (
      <div
        className={cn(
          above === "sm" && "hidden sm:block",
          above === "md" && "hidden md:block",
          above === "lg" && "hidden lg:block"
        )}
      >
        {children}
      </div>
    )
  }
  return <>{children}</>
}

/**
 * Show component only on specific breakpoints
 */
interface ShowProps {
  children: React.ReactNode
  above?: "sm" | "md" | "lg"
  below?: "md" | "lg" | "xl"
}

export function Show({ children, above, below }: ShowProps) {
  if (above) {
    return (
      <div
        className={cn(
          "hidden",
          above === "sm" && "sm:block",
          above === "md" && "md:block",
          above === "lg" && "lg:block"
        )}
      >
        {children}
      </div>
    )
  }
  if (below) {
    return (
      <div
        className={cn(
          below === "md" && "md:hidden",
          below === "lg" && "lg:hidden",
          below === "xl" && "xl:hidden",
          "block"
        )}
      >
        {children}
      </div>
    )
  }
  return <>{children}</>
}
