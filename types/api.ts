/**
 * API client type definitions
 * Replaces `any` types with proper TypeScript interfaces
 */

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  details?: unknown
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<{
  items: T[]
  pagination: PaginationMeta
}> {}

/**
 * Query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: "asc" | "desc"
  [key: string]: string | number | undefined
}

/**
 * Filter for database queries (Prisma-compatible)
 */
export interface WhereClause {
  [key: string]:
    | string
    | number
    | boolean
    | { [key: string]: string | number | boolean | undefined }
    | string[]
    | undefined
}

/**
 * API error response
 */
export interface ApiError {
  error: string
  type?: string
  details?: Record<string, unknown> | unknown[]
}

/**
 * User data
 */
export interface UserData {
  id: number
  email: string
  fullName: string
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT"
  avatarUrl?: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Course data
 */
export interface CourseData {
  id: number
  title: string
  slug: string
  description?: string
  thumbnail?: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  isPublished: boolean
  instructorId: number
  category?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Enrollment data
 */
export interface EnrollmentData {
  id: number
  userId: number
  courseId: number
  status: "ACTIVE" | "COMPLETED" | "DROPPED"
  progress: number
  enrolledAt: Date
  lastAccessedAt?: Date
  completedAt?: Date
}

/**
 * Module data
 */
export interface ModuleData {
  id: number
  title: string
  order: number
  courseId: number
  lessons?: LessonData[]
}

/**
 * Lesson data
 */
export interface LessonData {
  id: number
  title: string
  content?: string
  contentType: string
  order: number
  moduleId: number
  duration?: number
}

/**
 * Notification data
 */
export interface NotificationData {
  id: number
  userId: number
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  link?: string
  createdAt: Date
}

/**
 * Analytics data
 */
export interface AnalyticsData {
  period: string
  metrics: {
    totalUsers: number
    totalCourses: number
    totalEnrollments: number
    completionRate: number
    averageProgress: number
  }
  trends: {
    date: string
    users: number
    enrollments: number
  }[]
}

/**
 * Search filters
 */
export interface SearchFilters {
  query?: string
  type?: "courses" | "users" | "all"
  category?: string
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  instructorId?: number
}

/**
 * Form data types
 */
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  fullName: string
  email: string
  password: string
}

export interface CourseFormData {
  title: string
  description?: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  category?: string
  tags: string[]
  thumbnail?: string
}

/**
 * Upload response
 */
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}
