import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Matches the 36px input control horizontally and keeps a 96px minimum height so
 * a comment or lesson body has room without being oversized. Vertically
 * resizable — the previous build forced `resize-none` on a 64px box, which was
 * both too short and impossible to expand.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm transition-[color,border-color,box-shadow] outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
