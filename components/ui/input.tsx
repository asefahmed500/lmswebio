import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * 36px tall, 14px type, 12px inline padding, 6px radius, subtle border on a
 * white surface. The previous build shipped two different inputs (a 40px
 * borderless one and a 44px filled one), which is why form fields did not line
 * up between pages. There is now a single control height.
 *
 * `variant` is accepted and ignored. Nine call sites still pass
 * `variant="filled"`; with one normalised style there is nothing to switch, so
 * the prop is kept to avoid touching all nine and can be dropped later.
 */
function Input({
  className,
  type,
  variant: _variant,
  ...props
}: React.ComponentProps<"input"> & { variant?: "default" | "filled" }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm transition-[color,border-color,box-shadow] outline-none",
        "placeholder:text-muted-foreground",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
