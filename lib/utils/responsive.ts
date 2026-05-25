/**
 * Responsive utility functions and breakpoints
 */

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export type Breakpoint = keyof typeof breakpoints

/**
 * Check if current viewport matches or is larger than breakpoint
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const query = `(min-width: ${breakpoints[breakpoint]})`
  const mediaQuery = window.matchMedia(query)

  const [matches, setMatches] = React.useState(mediaQuery.matches)

  React.useEffect(() => {
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mediaQuery])

  return matches
}

/**
 * Check if current viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('md')
}

/**
 * Check if current viewport is tablet
 */
export function useIsTablet(): boolean {
  const isMobile = useMediaQuery('md')
  const isDesktop = useMediaQuery('lg')
  return !isMobile && !isDesktop
}

/**
 * Check if current viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('lg')
}

/**
 * Get responsive value based on breakpoint
 */
export function useResponsiveValue<T>(values: {
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}): T | undefined {
  const isMobile = useMediaQuery('sm')
  const isTablet = useMediaQuery('md')
  const isDesktop = useMediaQuery('lg')
  const isXL = useMediaQuery('xl')

  if (isXL && values.xl !== undefined) return values.xl
  if (isDesktop && values.lg !== undefined) return values.lg
  if (isTablet && values.md !== undefined) return values.md
  if (isMobile && values.sm !== undefined) return values.sm
  return undefined
}

import * as React from 'react'
