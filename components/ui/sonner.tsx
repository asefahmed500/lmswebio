"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Toast host.
 *
 * This was removed during the dead-primitive sweep because no component
 * imported it — which missed that 15 pages call `toast()` directly from the
 * `sonner` package. Without a mounted <Toaster> every one of those calls was a
 * silent no-op: grading, publishing, deleting and certificate issuance all
 * appeared to do nothing.
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="bottom-right"
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-md group-[.toaster]:border-border group-[.toaster]:bg-popover group-[.toaster]:text-foreground group-[.toaster]:shadow-md",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:border-destructive/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
