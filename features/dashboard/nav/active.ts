/**
 * Active-route resolution for sidebar items.
 *
 * The previous implementation inlined
 *   `href === pathname || pathname.startsWith(href + "/")`
 * at three separate call sites. That is ambiguous for sibling routes where one
 * path is a strict prefix of another — `/admin/users/new` reads as "All Users"
 * active. These helpers make exact match win first, then fall back to the
 * longest matching prefix.
 */

function normalize(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1)
  }
  return path
}

/** True when `href` is the exact route the user is on. */
export function isExactRoute(pathname: string, href: string): boolean {
  return normalize(pathname) === normalize(href)
}

/**
 * True when `href` is an ancestor of `pathname`.
 * Trailing slashes on either side are ignored.
 */
export function isAncestorRoute(pathname: string, href: string): boolean {
  const target = normalize(href)
  if (target === "/") return normalize(pathname) !== "/"
  return normalize(pathname).startsWith(`${target}/`)
}

/**
 * Primary active test for a leaf link: exact match, or a nested child route.
 *
 * A group heading is NOT active by virtue of having an active child — see
 * `hasActiveDescendant`, which is what drives the group's open state.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return isExactRoute(pathname, href) || isAncestorRoute(pathname, href)
}

/**
 * True when any child of a group is active, including the group heading's own
 * route. Used to decide whether a Collapsible group should be open and to mark
 * the heading itself as current.
 */
export function hasActiveDescendant(
  pathname: string,
  hrefs: readonly string[]
): boolean {
  return hrefs.some((href) => isNavItemActive(pathname, href))
}

/**
 * Resolves the open state for a collapsible group.
 *
 * `useState(hasActiveDescendant(...))` only ever evaluates on mount, so a group
 * stayed collapsed when the user navigated into it from elsewhere. Passing an
 * explicit `userToggled` value lets a deliberate open/close win over the route
 * default; pass `null` to track the route.
 *
 * This is a pure function on purpose — the caller owns the React state so the
 * "touched" flag and the derived default stay in one place.
 */
export function resolveGroupOpen(
  pathname: string,
  hrefs: readonly string[],
  userToggled: boolean | null
): boolean {
  return userToggled ?? hasActiveDescendant(pathname, hrefs)
}
