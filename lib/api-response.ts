import { NextResponse } from "next/server"
import { ZodError } from "zod"

/**
 * Standardized API error types with appropriate HTTP status codes
 */
export enum ApiErrorType {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  BAD_REQUEST = "BAD_REQUEST",
}

const ERROR_STATUS_MAP: Record<ApiErrorType, number> = {
  [ApiErrorType.UNAUTHORIZED]: 401,
  [ApiErrorType.FORBIDDEN]: 403,
  [ApiErrorType.NOT_FOUND]: 404,
  [ApiErrorType.VALIDATION_ERROR]: 400,
  [ApiErrorType.CONFLICT]: 409,
  [ApiErrorType.INTERNAL_ERROR]: 500,
  [ApiErrorType.RATE_LIMIT_EXCEEDED]: 429,
  [ApiErrorType.BAD_REQUEST]: 400,
}

/**
 * Standard error response format
 */
interface ApiErrorResponse {
  error: string
  type?: ApiErrorType
  details?: Record<string, unknown> | unknown[]
  requestId?: string
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  type: ApiErrorType,
  message: string,
  details?: Record<string, unknown> | unknown[],
  requestId?: string
): NextResponse<ApiErrorResponse> {
  const status = ERROR_STATUS_MAP[type]

  return NextResponse.json(
    {
      error: message,
      type,
      ...(details && { details }),
      ...(requestId && { requestId }),
    },
    { status }
  )
}

/**
 * Predefined error responses for common cases
 */
export const ApiErrors = {
  unauthorized(message = "Authentication required", details?: unknown[]) {
    return createErrorResponse(ApiErrorType.UNAUTHORIZED, message, details)
  },

  forbidden(message = "Access denied", details?: unknown[]) {
    return createErrorResponse(ApiErrorType.FORBIDDEN, message, details)
  },

  notFound(resource = "Resource", details?: unknown[]) {
    return createErrorResponse(
      ApiErrorType.NOT_FOUND,
      `${resource} not found`,
      details
    )
  },

  validationFailed(details: unknown[], message = "Validation failed") {
    return createErrorResponse(ApiErrorType.VALIDATION_ERROR, message, details)
  },

  conflict(message = "Resource already exists", details?: unknown[]) {
    return createErrorResponse(ApiErrorType.CONFLICT, message, details)
  },

  internal(message = "Internal server error", details?: unknown[]) {
    return createErrorResponse(ApiErrorType.INTERNAL_ERROR, message, details)
  },

  rateLimitExceeded(message = "Too many requests", retryAfter?: number) {
    const response = createErrorResponse(
      ApiErrorType.RATE_LIMIT_EXCEEDED,
      message
    )
    if (retryAfter) {
      response.headers.set("Retry-After", retryAfter.toString())
    }
    return response
  },

  badRequest(message = "Invalid request", details?: unknown[]) {
    return createErrorResponse(ApiErrorType.BAD_REQUEST, message, details)
  },
}

/**
 * Handle Zod validation errors consistently
 */
export function handleZodError(
  error: ZodError
): NextResponse<ApiErrorResponse> {
  const details = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }))

  return ApiErrors.validationFailed(details)
}

/**
 * Handle unknown errors with logging
 */
export function handleUnknownError(
  error: unknown,
  context?: string
): NextResponse<ApiErrorResponse> {
  console.error(`Error${context ? ` in ${context}` : ""}:`, error)

  if (error instanceof ZodError) {
    return handleZodError(error)
  }

  const message =
    process.env.NODE_ENV === "production"
      ? "An error occurred"
      : error instanceof Error
        ? error.message
        : "Unknown error"

  return ApiErrors.internal(message)
}

/**
 * Wrap async route handlers with consistent error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: string
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => handleUnknownError(error, context))
}

/**
 * Create a successful response with consistent format
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, unknown>
): NextResponse<{ data: T; meta?: Record<string, unknown> }> {
  return NextResponse.json({ data, ...(meta && { meta }) }, { status })
}
