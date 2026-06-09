import { describe, it, expect } from "vitest"
import { ApiErrorType } from "@/lib/api-response"

describe("ApiErrorType", () => {
  it("should have correct status code mapping", () => {
    const map: Record<ApiErrorType, number> = {
      [ApiErrorType.UNAUTHORIZED]: 401,
      [ApiErrorType.FORBIDDEN]: 403,
      [ApiErrorType.NOT_FOUND]: 404,
      [ApiErrorType.VALIDATION_ERROR]: 400,
      [ApiErrorType.CONFLICT]: 409,
      [ApiErrorType.INTERNAL_ERROR]: 500,
      [ApiErrorType.RATE_LIMIT_EXCEEDED]: 429,
      [ApiErrorType.BAD_REQUEST]: 400,
    }

    expect(map).toHaveProperty(ApiErrorType.UNAUTHORIZED)
    expect(map).toHaveProperty(ApiErrorType.FORBIDDEN)
    expect(map).toHaveProperty(ApiErrorType.NOT_FOUND)
    expect(map).toHaveProperty(ApiErrorType.VALIDATION_ERROR)
    expect(map).toHaveProperty(ApiErrorType.CONFLICT)
    expect(map).toHaveProperty(ApiErrorType.INTERNAL_ERROR)
    expect(map).toHaveProperty(ApiErrorType.RATE_LIMIT_EXCEEDED)
    expect(map).toHaveProperty(ApiErrorType.BAD_REQUEST)

    expect(map[ApiErrorType.UNAUTHORIZED]).toBe(401)
    expect(map[ApiErrorType.FORBIDDEN]).toBe(403)
    expect(map[ApiErrorType.INTERNAL_ERROR]).toBe(500)
    expect(map[ApiErrorType.RATE_LIMIT_EXCEEDED]).toBe(429)
  })
})
