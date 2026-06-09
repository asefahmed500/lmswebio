// Mock must be at the very top (hoisted by vi.mock)
import { vi } from "vitest"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  cleanup()
})

// Mock environment variables
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret-key-that-is-at-least-32-characters-long"
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-key-that-is-at-least-32-characters-long"
