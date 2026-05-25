"use client"

import * as React from "react"

interface LiveRegionProps {
  message?: string
  role?: "status" | "alert" | "assertive"
  "aria-live"?: "polite" | "assertive" | "off"
  className?: string
}

export function LiveRegion({
  message = "",
  role = "status",
  "aria-live": ariaLive = "polite",
  className = "",
}: LiveRegionProps) {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  )
}

export function useAnnounce() {
  const [announcement, setAnnouncement] = React.useState("")
  const [priority, setPriority] = React.useState<"polite" | "assertive">("polite")

  const announce = React.useCallback((message: string, p: "polite" | "assertive" = "polite") => {
    setAnnouncement(message)
    setPriority(p)
    setTimeout(() => setAnnouncement(""), 500)
  }, [])

  return { announce, region: (
    <LiveRegion
      message={announcement}
      role={priority === "assertive" ? "alert" : "status"}
      aria-live={priority}
    />
  ) }
}

export function VisuallyHidden({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={`sr-only ${className}`}>
      {children}
    </span>
  )
}

export function VisuallyHiddenFocus({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`
        sr-only focus:not-sr-only focus:absolute focus:inline-block
        focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2
        focus:bg-primary focus:text-primary-foreground focus:rounded
        ${className}
      `}
    >
      {children}
    </span>
  )
}
