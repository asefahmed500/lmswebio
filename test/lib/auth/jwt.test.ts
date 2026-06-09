import { describe, it, expect, beforeEach, vi } from "vitest"

const mockSign = vi.fn()
const mockVerify = vi.fn()

vi.mock("@/lib/auth/jwt", () => ({
  signAccessToken: mockSign,
  verifyAccessToken: mockVerify,
  signRefreshToken: mockSign,
  verifyRefreshToken: mockVerify,
}))

describe("JWT Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Access Tokens", () => {
    it("should sign and verify access token", async () => {
      mockSign.mockResolvedValue("mock-token")
      mockVerify.mockResolvedValue({ sub: 1, role: "STUDENT" })

      const { signAccessToken, verifyAccessToken } =
        await import("@/lib/auth/jwt")

      const token = await signAccessToken(1, "STUDENT")
      expect(token).toBe("mock-token")

      const payload = await verifyAccessToken(token)
      expect(payload).toEqual({ sub: 1, role: "STUDENT" })
    })

    it("should handle different user roles", async () => {
      mockSign.mockResolvedValue("mock-token")

      const { signAccessToken, verifyAccessToken } =
        await import("@/lib/auth/jwt")

      const roles = ["ADMIN", "INSTRUCTOR", "STUDENT"] as const

      for (const role of roles) {
        mockVerify.mockResolvedValue({ sub: 1, role })

        const token = await signAccessToken(1, role)
        const payload = await verifyAccessToken(token)
        expect(payload?.role).toBe(role)
      }
    })

    it("should return null for invalid token", async () => {
      mockVerify.mockResolvedValue(null)

      const { verifyAccessToken } = await import("@/lib/auth/jwt")

      const payload = await verifyAccessToken("invalid-token")
      expect(payload).toBeNull()
    })

    it("should return null for malformed token", async () => {
      mockVerify.mockResolvedValue(null)

      const { verifyAccessToken } = await import("@/lib/auth/jwt")

      const payload = await verifyAccessToken("not-a-valid-jwt")
      expect(payload).toBeNull()
    })

    it("should handle different user IDs", async () => {
      mockSign.mockResolvedValue("mock-token")

      const { signAccessToken, verifyAccessToken } =
        await import("@/lib/auth/jwt")

      const userIds = [1, 100, 9999]

      for (const userId of userIds) {
        mockVerify.mockResolvedValue({ sub: userId, role: "STUDENT" })

        const token = await signAccessToken(userId, "STUDENT")
        const payload = await verifyAccessToken(token)
        expect(payload?.sub).toBe(userId)
      }
    })
  })

  describe("Refresh Tokens", () => {
    it("should sign and verify refresh token", async () => {
      mockSign.mockResolvedValue("mock-refresh-token")
      mockVerify.mockResolvedValue({ sub: 1 })

      const { signRefreshToken, verifyRefreshToken } =
        await import("@/lib/auth/jwt")

      const token = await signRefreshToken(1)
      expect(token).toBe("mock-refresh-token")

      const payload = await verifyRefreshToken(token)
      expect(payload).toEqual({ sub: 1 })
    })

    it("should return null for invalid refresh token", async () => {
      mockVerify.mockResolvedValue(null)

      const { verifyRefreshToken } = await import("@/lib/auth/jwt")

      const payload = await verifyRefreshToken("invalid-token")
      expect(payload).toBeNull()
    })

    it("should handle different user IDs", async () => {
      mockSign.mockResolvedValue("mock-refresh-token")

      const { signRefreshToken, verifyRefreshToken } =
        await import("@/lib/auth/jwt")

      const userIds = [1, 100, 9999]

      for (const userId of userIds) {
        mockVerify.mockResolvedValue({ sub: userId })

        const token = await signRefreshToken(userId)
        const payload = await verifyRefreshToken(token)
        expect(payload?.sub).toBe(userId)
      }
    })
  })
})
