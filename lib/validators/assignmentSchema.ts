import { z } from "zod"

/**
 * Assignment form validation schema
 */
export const assignmentSchema = z.object({
  title: z
    .string()
    .min(1, "Assignment title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  dueDate: z
    .string()
    .refine((date) => {
      if (!date) return true
      const dueDate = new Date(date)
      const now = new Date()
      return dueDate > now
    }, "Due date must be in the future")
    .optional(),
  maxPoints: z
    .number()
    .min(1, "Assignment must be worth at least 1 point")
    .max(1000, "Assignment cannot be worth more than 1000 points"),
  courseId: z.string(),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>

/**
 * Assignment submission validation schema
 */
export const assignmentSubmissionSchema = z
  .object({
    assignmentId: z.string(),
    textAnswer: z
      .string()
      .max(10000, "Answer must be less than 10000 characters")
      .optional(),
    fileUrl: z.string().url("Invalid file URL").optional(),
  })
  .refine((data) => data.textAnswer || data.fileUrl, {
    message: "Either text answer or file upload is required",
    path: ["textAnswer"],
  })

export type AssignmentSubmissionFormData = z.infer<
  typeof assignmentSubmissionSchema
>

/**
 * Assignment grading validation schema
 */
export const assignmentGradingSchema = z.object({
  grade: z
    .number()
    .min(0, "Grade cannot be negative")
    .max(1000, "Grade cannot exceed maximum points"),
  feedback: z
    .string()
    .max(5000, "Feedback must be less than 5000 characters")
    .optional(),
})

export type AssignmentGradingFormData = z.infer<typeof assignmentGradingSchema>
