/**
 * Type definitions for the LMS application
 * These types correspond to the mock data structure and Prisma schema from the PRD
 */

// ============================================
// User & Authentication Types
// ============================================

/**
 * User roles in the LMS system - matches Prisma schema
 */
export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT"

/**
 * Role constant for use in components
 */
export const Role = {
  ADMIN: "ADMIN" as Role,
  INSTRUCTOR: "INSTRUCTOR" as Role,
  STUDENT: "STUDENT" as Role,
} as const

/**
 * User account information
 */
export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  avatarUrl?: string
  isActive?: boolean
  isEmailVerified?: boolean
  createdAt: string
}

/**
 * Mock authentication state (to be replaced with real JWT later)
 */
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ============================================
// Course Types
// ============================================

/**
 * Course difficulty levels - matches Prisma schema
 */
export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

/**
 * Level constant for use in components
 */
export const Level = {
  BEGINNER: "BEGINNER" as Level,
  INTERMEDIATE: "INTERMEDIATE" as Level,
  ADVANCED: "ADVANCED" as Level,
} as const

/**
 * Main course object
 */
export interface Course {
  id: string
  title: string
  slug: string
  description?: string
  thumbnail?: string
  level: Level
  isPublished: boolean
  instructorId: string
  instructor?: User // Populated when needed
  modules: Module[]
  category?: string
  tags?: string[]
  createdAt: string
  updatedAt?: string
}

/**
 * Module within a course (container for lessons)
 */
export interface Module {
  id: string
  title: string
  order: number
  courseId: string
  lessons: Lesson[]
  lessonCount?: number // Optional count for mock data compatibility
}

/**
 * Lesson content types - matches Prisma schema
 */
export type LessonContentType = "text" | "video" | "pdf"

/**
 * LessonContentType constant for use in components
 */
export const LessonContentType = {
  TEXT: "text" as LessonContentType,
  VIDEO: "video" as LessonContentType,
  PDF: "pdf" as LessonContentType,
} as const

/**
 * Individual lesson within a module
 */
export interface Lesson {
  id: string
  title: string
  content?: string // HTML content or video URL
  contentType: LessonContentType
  order: number
  moduleId: string
  duration?: number // in minutes (for video)
  isCompleted?: boolean // For student view
}

// ============================================
// Enrollment & Progress Types
// ============================================

/**
 * Enrollment status for student-course relationship - matches Prisma schema
 */
export type EnrolmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED"

/**
 * EnrolmentStatus constant for use in components
 */
export const EnrolmentStatus = {
  ACTIVE: "ACTIVE" as EnrolmentStatus,
  COMPLETED: "COMPLETED" as EnrolmentStatus,
  DROPPED: "DROPPED" as EnrolmentStatus,
} as const

/**
 * Student enrollment in a course
 */
export interface Enrollment {
  id: string
  userId: string
  user?: User
  courseId: string
  course?: Course
  enrolledAt: string
  status: EnrolmentStatus
  progress: number // 0-100
  lastAccessedAt?: string
  completedAt?: string
}

/**
 * Lesson completion record
 */
export interface LessonCompletion {
  id: string
  userId: string
  lessonId: string
  completedAt: string
}

// ============================================
// Assessment & Quiz Types
// ============================================

/**
 * Question types for quizzes - matches Prisma schema
 */
export type QuestionType = "MC_SINGLE" | "MC_MULTI" | "TEXT" | "TRUE_FALSE"

/**
 * QuestionType constant for use in components
 */
export const QuestionType = {
  MC_SINGLE: "MC_SINGLE" as QuestionType,
  MC_MULTI: "MC_MULTI" as QuestionType,
  TEXT: "TEXT" as QuestionType,
  TRUE_FALSE: "TRUE_FALSE" as QuestionType,
} as const

/**
 * Quiz object
 */
export interface Quiz {
  id: string
  title: string
  description?: string
  courseId: string
  course?: Course
  timeLimit?: number // in minutes
  attemptsAllowed: number
  questions: QuizQuestion[]
  createdAt: string
}

/**
 * Individual quiz question
 */
export interface QuizQuestion {
  id: string
  quizId: string
  text: string
  type: QuestionType
  points: number
  options?: Record<string, string> // e.g., { "A": "Option A", "B": "Option B" }
  correctAnswer: string | string[] // Single or multiple correct option keys
}

/**
 * Student quiz attempt
 */
export interface QuizAttempt {
  id: string
  quizId: string
  quiz?: Quiz
  userId: string
  user?: User
  score?: number // 0-100 or points
  submittedAt: string
  answers: Record<string, string | string[]> // Question ID -> answer(s)
  feedback?: string
}

// ============================================
// Assignment Types
// ============================================

/**
 * Assignment object
 */
export interface Assignment {
  id: string
  title: string
  description?: string
  dueDate?: string
  maxPoints: number
  courseId: string
  course?: Course
  createdAt: string
}

/**
 * Student assignment submission
 */
export interface AssignmentSubmission {
  id: string
  assignmentId: string
  assignment?: Assignment
  userId: string
  user?: User
  fileUrl?: string
  textAnswer?: string
  grade?: number
  feedback?: string
  submittedAt: string
  gradedAt?: string
}

// ============================================
// Analytics & Dashboard Types
// ============================================

/**
 * KPI card data for dashboards
 */
export interface KPICard {
  label: string
  value: number | string
  change?: number // Percentage change
  trend?: "up" | "down" | "neutral"
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string
  value: number
}

/**
 * Weekly enrollment data for admin charts
 */
export interface WeeklyEnrollment {
  week: string
  enrollments: number
}

/**
 * Course performance data
 */
export interface CoursePerformance {
  courseId: string
  courseName: string
  totalStudents: number
  averageProgress: number
  completionRate: number
}

/**
 * Student progress summary
 */
export interface StudentProgress {
  courseId: string
  courseName: string
  progress: number
  lastLesson: string
  nextLesson?: string
}

// ============================================
// Sidebar Navigation Types
// ============================================

/**
 * Sidebar menu item structure
 */
export interface SidebarMenuItem {
  title: string
  icon?: string // Lucide icon name
  href?: string
  items?: SidebarMenuItem[] // For dropdowns
  badge?: number // Notification badge count
}

/**
 * Role-based sidebar configuration
 */
export interface SidebarConfig {
  ADMIN: SidebarMenuItem[]
  INSTRUCTOR: SidebarMenuItem[]
  STUDENT: SidebarMenuItem[]
}

// ============================================
// Form Types
// ============================================

/**
 * Course creation/editing form data
 */
export interface CourseFormData {
  title: string
  description: string
  level: Level
  category?: string
  tags?: string[]
  thumbnail?: string
}

/**
 * Module form data
 */
export interface ModuleFormData {
  title: string
}

/**
 * Lesson form data
 */
export interface LessonFormData {
  title: string
  content: string
  contentType: LessonContentType
  duration?: number
}

/**
 * Quiz form data
 */
export interface QuizFormData {
  title: string
  description?: string
  courseId: string
  timeLimit?: number
  attemptsAllowed: number
}

/**
 * Question form data
 */
export interface QuestionFormData {
  text: string
  type: QuestionType
  points: number
  options?: Record<string, string>
  correctAnswer: string | string[]
}

/**
 * Assignment form data
 */
export interface AssignmentFormData {
  title: string
  description?: string
  dueDate?: string
  maxPoints: number
  courseId: string
}

/**
 * Login form data
 */
export interface LoginFormData {
  email: string
  password: string
  remember?: boolean
}

/**
 * Registration form data
 */
export interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}
