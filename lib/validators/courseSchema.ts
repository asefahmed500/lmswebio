import { z } from "zod"
import { Level, LessonContentType } from "@/types"

/**
 * Course form validation schema
 * Validates course creation and editing
 */
export const courseSchema = z.object({
  title: z
    .string()
    .min(1, "Course title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  level: z.nativeEnum(Level, {
    message: "Course level is required",
  }),
  category: z.string().min(1, "Category is required").optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
  thumbnail: z.string().url("Invalid URL").optional().or(z.literal("")),
})

export type CourseFormData = z.infer<typeof courseSchema>

/**
 * Module form validation schema
 */
export const moduleSchema = z.object({
  title: z
    .string()
    .min(1, "Module title is required")
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
})

export type ModuleFormData = z.infer<typeof moduleSchema>

/**
 * Lesson form validation schema
 */
export const lessonSchema = z.object({
  title: z
    .string()
    .min(1, "Lesson title is required")
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .min(10, "Content must be at least 10 characters"),
  contentType: z.nativeEnum(LessonContentType, {
    message: "Content type is required",
  }),
  duration: z
    .number()
    .min(1, "Duration must be at least 1 minute")
    .max(480, "Duration cannot exceed 8 hours")
    .optional(),
})

export type LessonFormData = z.infer<typeof lessonSchema>
