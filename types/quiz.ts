/**
 * Quiz type definitions
 * Replaces `any` types with proper TypeScript interfaces
 */

export type QuestionType = "MC_SINGLE" | "MC_MULTI" | "TEXT" | "TRUE_FALSE"

export interface QuizOption {
  [key: string]: string
}

export interface QuizQuestion {
  id: number
  text: string
  type: QuestionType
  points: number
  options?: QuizOption
  correctAnswer?: string | string[] | boolean
}

/**
 * Quiz answer - supports all question types
 */
export type QuizAnswer =
  | { type: "MC_SINGLE" | "TRUE_FALSE"; value: string }
  | { type: "MC_MULTI"; value: string[] }
  | { type: "TEXT"; value: string }

/**
 * Quiz answers record - maps question ID to answer
 */
export interface QuizAnswers {
  [questionId: number]: QuizAnswer["value"]
}

/**
 * Quiz attempt data
 */
export interface QuizAttempt {
  id: number
  quizId: number
  userId: number
  score?: number
  submittedAt: Date
  answers: QuizAnswers
}

/**
 * Quiz data for player
 */
export interface QuizData {
  id: number
  title: string
  description?: string
  timeLimit?: number
  attemptsAllowed: number
  questions: QuizQuestion[]
}
