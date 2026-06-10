/**
 * Common types for API routes
 * Replaces `any` types with proper TypeScript interfaces
 */

/**
 * Generic query filter type
 */
export interface QueryFilter {
  where?: Record<string, unknown>
  include?: Record<string, unknown>
  select?: Record<string, boolean>
  orderBy?: Record<string, "asc" | "desc">
  take?: number
  skip?: number
  cursor?: unknown
}

/**
 * Generic API request context
 */
export interface ApiRequestContext {
  user?: {
    id: string
    email: string
    fullName: string
    role: "ADMIN" | "INSTRUCTOR" | "STUDENT"
  }
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  q?: string
  query?: string
  search?: string
  type?: string
  page?: string
  limit?: string
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number | string
  limit?: number | string
  offset?: number | string
}

/**
 * ID parameter
 */
export interface IdParams {
  id: string | number
}

/**
 * Generic success response
 */
export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  success: false
  error: string
  details?: unknown
}

/**
 * Generic API response
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse

/**
 * User search filter
 */
export interface UserSearchFilter {
  email?: { contains: string; mode?: "insensitive" }
  fullName?: { contains: string; mode?: "insensitive" }
  role?: "ADMIN" | "INSTRUCTOR" | "STUDENT"
  isActive?: boolean
}

/**
 * Course search filter
 */
export interface CourseSearchFilter {
  title?: { contains: string; mode?: "insensitive" }
  description?: { contains: string; mode?: "insensitive" }
  category?: string
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  isPublished?: boolean
  instructorId?: string
  tags?: { hasSome: string[] }
}

/**
 * Enrollment filter
 */
export interface EnrollmentFilter {
  userId?: string
  courseId?: string
  status?: "ACTIVE" | "COMPLETED" | "DROPPED"
}

/**
 * Progress data
 */
export interface ProgressData {
  overallProgress: number
  totalCompletedLessons: number
  totalLessons: number
  courseProgress: Array<{
    courseId: string
    courseTitle: string
    progress: number
    completedLessons: number
    totalLessons: number
  }>
}

/**
 * Analytics metrics
 */
export interface AnalyticsMetrics {
  period: string
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  activeUsers: number
  completionRate: number
  averageProgress: number
}

/**
 * Notification type
 */
export type NotificationType = "info" | "success" | "warning" | "error"

/**
 * Create notification data
 */
export interface CreateNotificationData {
  userId: string
  title: string
  message: string
  type?: NotificationType
  link?: string
}

/**
 * Update notification data
 */
export interface UpdateNotificationData {
  read?: boolean
}

/**
 * Bookmark data
 */
export interface BookmarkData {
  lessonId: string
  timestamp?: number
}

/**
 * Note data
 */
export interface NoteData {
  lessonId: string
  content: string
  timestamp?: number
  isPrivate?: boolean
}

/**
 * Discussion data
 */
export interface DiscussionData {
  courseId: string
  title: string
  content: string
}

/**
 * Comment data
 */
export interface CommentData {
  discussionId: string
  content: string
  parentId?: string
}

/**
 * Review data
 */
export interface ReviewData {
  courseId: string
  rating: number
  review?: string
}
