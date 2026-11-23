"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Shared page header.
 *
 * Fifty-seven pages each declared their own `<h1 className="text-3xl
 * font-bold tracking-tight">`, which is how the title size drifted. The type
 * scale lives here now: 24px semibold title, 14px muted description, and an
 * optional action slot on the right that collapses above the small breakpoint.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {action}
        </div>
      ) : null}
    </div>
  )
}
