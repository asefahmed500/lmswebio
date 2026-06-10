import * as React from "react"

import { cn } from "@/lib/utils"

const inputBase =
  "h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive md:text-sm dark:aria-invalid:border-b-destructive/50"

const inputFilled =
  "h-11 w-full rounded-lg border border-input bg-input px-3 py-2 text-sm transition-[color,border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50"

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<"input"> & { variant?: "default" | "filled" }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        variant === "filled" ? inputFilled : inputBase,
        className
      )}
      {...props}
    />
  )
}

export { Input }
