import { z } from "zod"

export const createSubmissionSchema = z
  .object({
    assignmentId: z.string(),
    fileUrl: z.string().url("File URL must be a valid URL").optional(),
    textAnswer: z
      .string()
      .max(10000, "Text answer must be less than 10,000 characters")
      .optional(),
  })
  .refine((data) => data.fileUrl || data.textAnswer, {
    message: "Either fileUrl or textAnswer must be provided",
  })

export const updateSubmissionSchema = z
  .object({
    fileUrl: z.string().url("File URL must be a valid URL").optional(),
    textAnswer: z
      .string()
      .max(10000, "Text answer must be less than 10,000 characters")
      .optional(),
  })
  .refine((data) => data.fileUrl || data.textAnswer, {
    message: "Either fileUrl or textAnswer must be provided",
  })

export const gradeSubmissionSchema = z.object({
  grade: z.number().nonnegative().optional(),
  feedback: z
    .string()
    .max(5000, "Feedback must be less than 5,000 characters")
    .optional(),
})
