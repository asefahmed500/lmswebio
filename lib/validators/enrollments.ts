import { z } from "zod"

export const createEnrollmentSchema = z.object({
  courseId: z.number().int().positive("Course ID must be a positive integer"),
})

export const updateEnrollmentSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "DROPPED"], {
    errorMap: () => ({ message: "Status must be one of: ACTIVE, COMPLETED, DROPPED" })
  }).optional(),
  progress: z.number().min(0, "Progress must be at least 0").max(100, "Progress must be at most 100").optional(),
})

export const bulkEnrollSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1, "At least one user ID is required"),
  courseId: z.number().int().positive("Course ID must be a positive integer"),
})
