import { describe, it, expect, beforeEach } from 'vitest'
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt'

describe('JWT Authentication', () => {
  beforeEach(() => {
    // Ensure env vars are set for tests
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-at-least-32-characters-long'
  })

  describe('Access Tokens', () => {
    it('should sign and verify access token', async () => {
      const token = await signAccessToken(1, 'STUDENT')
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      const payload = await verifyAccessToken(token)
      expect(payload).toEqual({ sub: 1, role: 'STUDENT' })
    })

    it('should handle different user roles', async () => {
      const roles = ['ADMIN', 'INSTRUCTOR', 'STUDENT'] as const

      for (const role of roles) {
        const token = await signAccessToken(1, role)
        const payload = await verifyAccessToken(token)
        expect(payload?.role).toBe(role)
      }
    })

    it('should return null for invalid token', async () => {
      const payload = await verifyAccessToken('invalid-token')
      expect(payload).toBeNull()
    })

    it('should return null for malformed token', async () => {
      const payload = await verifyAccessToken('not-a-valid-jwt')
      expect(payload).toBeNull()
    })

    it('should handle different user IDs', async () => {
      const userIds = [1, 100, 9999]

      for (const userId of userIds) {
        const token = await signAccessToken(userId, 'STUDENT')
        const payload = await verifyAccessToken(token)
        expect(payload?.sub).toBe(userId)
      }
    })
  })

  describe('Refresh Tokens', () => {
    it('should sign and verify refresh token', async () => {
      const token = await signRefreshToken(1)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      const payload = await verifyRefreshToken(token)
      expect(payload).toEqual({ sub: 1 })
    })

    it('should return null for invalid refresh token', async () => {
      const payload = await verifyRefreshToken('invalid-token')
      expect(payload).toBeNull()
    })

    it('should handle different user IDs', async () => {
      const userIds = [1, 100, 9999]

      for (const userId of userIds) {
        const token = await signRefreshToken(userId)
        const payload = await verifyRefreshToken(token)
        expect(payload?.sub).toBe(userId)
      }
    })
  })
})
