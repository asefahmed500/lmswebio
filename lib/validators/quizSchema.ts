import { z } from "zod"
import { QuestionType } from "@/types"

/**
 * Quiz form validation schema
 */
export const quizSchema = z.object({
  title: z
    .string()
    .min(1, "Quiz title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  courseId: z
    .number()
    .int("Course ID must be an integer")
    .positive("Course ID must be positive"),
  timeLimit: z
    .number()
    .int("Time limit must be an integer")
    .min(5, "Time limit must be at least 5 minutes")
    .max(300, "Time limit cannot exceed 5 hours")
    .optional(),
  attemptsAllowed: z
    .number()
    .int("Attempts must be an integer")
    .min(1, "At least 1 attempt is required")
    .max(10, "Maximum 10 attempts allowed"),
})

export type QuizFormData = z.infer<typeof quizSchema>

/**
 * Quiz question form validation schema
 */
export const quizQuestionSchema = z.object({
  text: z
    .string()
    .min(1, "Question text is required")
    .min(5, "Question must be at least 5 characters")
    .max(1000, "Question must be less than 1000 characters"),
  type: z.nativeEnum(QuestionType, {
    message: "Question type is required",
  }),
  points: z
    .number()
    .int("Points must be an integer")
    .min(1, "Question must be worth at least 1 point")
    .max(100, "Question cannot be worth more than 100 points"),
  options: z
    .record(z.string(), z.string())
    .refine((data) => {
      // For multiple choice questions, at least 2 options are required
      return Object.keys(data).length >= 2
    }, "At least 2 options required for multiple choice questions")
    .optional(),
  correctAnswer: z
    .union([z.string(), z.array(z.string())])
    .refine((val) => val !== null && val !== undefined, {
      message: "Correct answer is required",
    }),
})

export type QuizQuestionFormData = z.infer<typeof quizQuestionSchema>
