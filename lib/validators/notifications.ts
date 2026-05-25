import { z } from "zod"

export const createNotificationSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive integer"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1,000 characters"),
  type: z.enum(["info", "success", "warning", "error"], {
    errorMap: () => ({ message: "Type must be one of: info, success, warning, error" })
  }).default("info"),
  link: z.string().url("Link must be a valid URL").optional(),
})

export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
})

export const markAllReadSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive integer"),
})

export const bulkNotificationSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1, "At least one user ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1,000 characters"),
  type: z.enum(["info", "success", "warning", "error"], {
    errorMap: () => ({ message: "Type must be one of: info, success, warning, error" })
  }).default("info"),
  link: z.string().url("Link must be a valid URL").optional(),
})
