"use client"

import * as React from "react"

/**
 * Subscribe to a CSS media query.
 *
 * Built on `useSyncExternalStore` rather than the common
 * `useState` + `useEffect` + `matchMedia` pattern. The effect pattern has two
 * problems: it calls `setState` synchronously inside the effect body, which the
 * React Compiler lint rejects because it causes a cascading render, and it
 * always reports `false` for the first paint, so desktop and mobile branches
 * briefly render the wrong tree.
 *
 * `useSyncExternalStore` fixes both — it is designed for exactly this, reading
 * an external system — and the server snapshot keeps hydration stable.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onStoreChange)
      return () => mql.removeEventListener("change", onStoreChange)
    },
    [query]
  )

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  }, [query])

  // Server render assumes the small layout, which is also the safe default:
  // the mobile shell has no JS-dependent chrome to get stuck behind.
  const getServerSnapshot = React.useCallback(() => false, [])

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Viewport at or above the app-shell sidebar breakpoint. */
export const DESKTOP_QUERY = "(min-width: 768px)"

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY)
}

/**
 * Whether the client has hydrated.
 *
 * Returns `false` on the server and during the first client render, then `true`.
 * Gate anything that reads a client-only value (theme, viewport, stored state)
 * behind this so the first client render matches the server exactly.
 */
const noopSubscribe = () => () => {}

export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 *
 * Several list pages wired their search box straight to a fetch effect, so every
 * keystroke issued a request and out-of-order responses could render stale
 * results over newer ones. Debouncing the value the effect depends on fixes
 * both without changing the input itself.
 */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState<T>(value)

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
