"use client"

import * as React from "react"

interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  onDeactivate?: () => void
}

/**
 * FocusTrap component for accessibility
 * Traps focus within a container (used for modals, dialogs)
 * Note: Radix UI components have built-in focus trap - use this for custom containers
 */
export function FocusTrap({
  children,
  enabled = true,
  onDeactivate,
}: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  const getFocusableElements = React.useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(
      containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    )
  }, [])

  const trapFocus = React.useCallback(() => {
    if (!enabled) return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    firstElement?.focus()
  }, [enabled, getFocusableElements])

  const restoreFocus = React.useCallback(() => {
    previousActiveElement.current?.focus()
  }, [])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || !containerRef.current) return

      if (e.key === "Tab") {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [enabled, getFocusableElements]
  )

  React.useEffect(() => {
    if (!enabled) return

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Trap focus
    trapFocus()

    // Restore focus when unmounted
    return () => {
      restoreFocus()
      onDeactivate?.()
    }
  }, [enabled, trapFocus, restoreFocus, onDeactivate])

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}
