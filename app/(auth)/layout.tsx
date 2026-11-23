/**
 * Skip-link target for the auth route group.
 *
 * The root layout renders a global "Skip to content" link pointing at
 * #main-content. The dashboard shell and public pages provide that id, but the
 * auth pages did not, so the link went nowhere on /login and /register.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <main id="main-content">{children}</main>
}
