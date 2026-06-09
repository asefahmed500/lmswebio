/**
 * Responsive utility functions and breakpoints
 */

import * as React from "react"

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const

export type Breakpoint = keyof typeof breakpoints

/**
 * Check if current viewport matches or is larger than breakpoint
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const query = `(min-width: ${breakpoints[breakpoint]})`

  const [matches, setMatches] = React.useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  return matches
}

/**
 * Check if current viewport is mobile
 * Returns true when viewport is less than md breakpoint (768px)
 */
export function useIsMobile(): boolean {
  return !useMediaQuery("md")
}

/**
 * Check if current viewport is tablet
 */
export function useIsTablet(): boolean {
  const isMobile = useMediaQuery("md")
  const isDesktop = useMediaQuery("lg")
  return !isMobile && !isDesktop
}

/**
 * Check if current viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("lg")
}

/**
 * Get responsive value based on breakpoint
 */
export function useResponsiveValue<T>(values: {
  sm?: T
  md?: T
  lg?: T
  xl?: T
  "2xl"?: T
}): T | undefined {
  const isMobile = useMediaQuery("sm")
  const isTablet = useMediaQuery("md")
  const isDesktop = useMediaQuery("lg")
  const isXL = useMediaQuery("xl")

  if (isXL && values.xl !== undefined) return values.xl
  if (isDesktop && values.lg !== undefined) return values.lg
  if (isTablet && values.md !== undefined) return values.md
  if (isMobile && values.sm !== undefined) return values.sm
  return undefined
}
