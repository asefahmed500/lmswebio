/**
 * The app has a deliberately small motion vocabulary.

 * Only state changes that need a visual cue animate, and they all use the same
 * short duration and standard easing token from `app/globals.css`. There are no
 * staggered list entrances, page slide-ins or springy overlays — those made a
 * dense work UI feel busy without adding information.
 *
 * All motion is suppressed by the `prefers-reduced-motion` block in
 * `globals.css`, so no per-usage guard is needed.
 */

export const motionDuration = {
  fast: "var(--motion-duration-fast)",
  base: "var(--motion-duration-base)",
} as const

export const motionEaseStandard = "var(--motion-ease-standard)"

/** Shared chevron/group transition used by the sidebar. */
export const sidebarMotion = {
  chevron: `transition-transform duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]`,
  group: `transition-[height] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]`,
} as const
