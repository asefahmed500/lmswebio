/**
 * Named motion presets for the app shell.
 *
 * Timing lives here instead of being retyped as literal Tailwind duration
 * classes. Every duration is read from a token declared in `app/globals.css`
 * under `@theme inline` and referenced through an arbitrary-value class.
 *
 * Note: Tailwind v4 scans raw file text for candidate class names, including
 * inside comments. Do not write a complete arbitrary-value duration class in a
 * comment here — it gets compiled into a broken utility. Refer to the tokens by
 * name instead.
 *
 * All motion is suppressed by the `prefers-reduced-motion` block in
 * `globals.css`, so no per-preset guard is needed.
 */

const standard = "var(--motion-ease-standard)"
const emphasized = "var(--motion-ease-emphasized)"
const exitEase = "var(--motion-ease-exit)"

export const motionDuration = {
  instant: "var(--motion-duration-instant)",
  fast: "var(--motion-duration-fast)",
  base: "var(--motion-duration-base)",
  slow: "var(--motion-duration-slow)",
} as const

/**
 * Preset 1 — sidebar group expand/collapse and the rail.
 *
 * Tailwind classes for shadcn `Collapsible` / `Sidebar` markup.
 */
export const sidebarMotion = {
  group: `overflow-hidden transition-[height] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]`,
  chevron: `transition-transform duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]`,
} as const

/**
 * Preset 2 — page content entering after navigation.
 * An 8px rise plus fade: short enough not to delay reading, long enough to
 * register as a state change.
 */
export const pageEnter = {
  className: `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-[var(--motion-duration-base)] motion-safe:ease-[var(--motion-ease-standard)]`,
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: standard },
} as const

/**
 * Preset 3 — list items arriving in sequence.
 * Stagger step scales down for long lists so total settle time stays roughly
 * constant regardless of row count.
 */
export function staggerList(index: number, total?: number) {
  const step = total && total > 8 ? 0.024 : 0.035
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: standard, delay: index * step },
  }
}

/**
 * Preset 4 — overlay surfaces (dropdown, popover, sheet, tooltip).
 * Asymmetric: enter is slower than exit so opening feels deliberate and
 * closing feels immediate.
 */
export const overlayMotion = {
  enter: `duration-[var(--motion-duration-enter)] ease-[var(--motion-ease-emphasized)]`,
  exit: `duration-[var(--motion-duration-exit)] ease-[var(--motion-ease-exit)]`,
} as const

export {
  standard as motionEaseStandard,
  emphasized as motionEaseEmphasized,
  exitEase as motionEaseExit,
}
