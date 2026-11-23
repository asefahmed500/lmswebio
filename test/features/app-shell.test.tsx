import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

/**
 * Regression guard for the app shell.
 *
 * `DashboardHeader` always renders `<SidebarTrigger>`, and `SidebarTrigger`
 * calls `useSidebar()`, which throws unless a `SidebarProvider` is mounted above
 * it. The shell used to provide that context only in the desktop branch, so
 * every dashboard page threw below the 768px breakpoint and the route group's
 * ErrorBoundary replaced the whole page with an error screen.
 *
 * These tests render the shell with a mocked viewport at both sides of the
 * breakpoint to prove neither branch throws.
 */

const mockUser = {
  id: "u1",
  email: "student@lms.com",
  fullName: "Test Student",
  role: "STUDENT" as const,
  createdAt: new Date().toISOString(),
}

let isDesktop = true
const listeners = new Set<() => void>()

function setViewport(desktop: boolean) {
  isDesktop = desktop
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/student",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock("@/lib/api-client", () => ({
  apiGet: vi
    .fn()
    .mockResolvedValue({ data: { notifications: [], unreadCount: 0 } }),
  apiPatch: vi.fn().mockResolvedValue({ data: { success: true } }),
}))

vi.mock("@/next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))

async function importShell() {
  const mod = await import("@/features/dashboard/layout/app-shell")
  return mod.AppShell
}

beforeEach(() => {
  isDesktop = true
  listeners.clear()
  setViewport(true)
  Object.defineProperty(window, "location", {
    writable: true,
    value: { href: "", assign: vi.fn(), replace: vi.fn() },
  })
})

describe("AppShell sidebar context", () => {
  it("renders the mobile branch without throwing when under 768px", async () => {
    setViewport(false)
    const AppShell = await importShell()

    expect(() =>
      render(
        <AppShell>
          <p>page content</p>
        </AppShell>
      )
    ).not.toThrow()

    expect(screen.getByText("page content")).toBeInTheDocument()
  })

  it("renders the desktop branch without throwing at 768px and above", async () => {
    setViewport(true)
    const AppShell = await importShell()

    expect(() =>
      render(
        <AppShell>
          <p>page content</p>
        </AppShell>
      )
    ).not.toThrow()

    expect(screen.getByText("page content")).toBeInTheDocument()
  })

  it("provides sidebar context to the header trigger on mobile", async () => {
    setViewport(false)
    const AppShell = await importShell()

    render(
      <AppShell>
        <p>page content</p>
      </AppShell>
    )

    // SidebarTrigger renders a toggle button; if useSidebar() had thrown, the
    // ErrorBoundary would have replaced this tree.
    const toggle = screen
      .getAllByRole("button")
      .find((el) => el.getAttribute("data-sidebar") === "trigger")
    expect(toggle).toBeDefined()
  })
})
