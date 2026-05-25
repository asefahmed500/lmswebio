/**
 * API client utility functions for making authenticated requests
 */

import { getSession } from "./auth/jwt"
import type {
  ApiResponse,
  UploadResponse,
  LoginFormData,
  RegisterFormData,
  CourseFormData,
} from "@/types/api"

/**
 * Make an authenticated GET request
 */
export async function apiGet<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Unauthorized" }
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return { error: errorData.error || response.statusText }
    }

    return { data: await response.json() }
  } catch (error) {
    console.error(`API GET ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

/**
 * Make an authenticated POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body?: Record<string, unknown> | FormData,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Unauthorized" }
    }

    const isFormData = body instanceof FormData
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "POST",
      headers: {
        ...options?.headers,
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
      body: isFormData ? body : JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return { error: errorData.error || response.statusText }
    }

    return { data: await response.json() }
  } catch (error) {
    console.error(`API POST ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

/**
 * Make an authenticated PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Unauthorized" }
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "PUT",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return { error: errorData.error || response.statusText }
    }

    return { data: await response.json() }
  } catch (error) {
    console.error(`API PUT ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

/**
 * Make an authenticated PATCH request
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Unauthorized" }
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "PATCH",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return { error: errorData.error || response.statusText }
    }

    return { data: await response.json() }
  } catch (error) {
    console.error(`API PATCH ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Unauthorized" }
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "DELETE",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return { error: errorData.error || response.statusText }
    }

    return { data: await response.json() }
  } catch (error) {
    console.error(`API DELETE ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

/**
 * Upload a file
 */
export async function uploadFile(
  file: File,
  type: "avatar" | "course-thumbnail" | "lesson-video" | "assignment"
): Promise<ApiResponse<UploadResponse>> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
      return { error: errorData.error || "Upload failed" }
    }

    return { data: await response.json() }
  } catch (error) {
    console.error("File upload error:", error)
    return { error: "Upload failed" }
  }
}

/**
 * Login user
 */
export async function login(data: LoginFormData): Promise<ApiResponse<{ user: unknown }>> {
  return apiPost("/auth/login", data)
}

/**
 * Register user
 */
export async function register(data: RegisterFormData): Promise<ApiResponse<{ user: unknown }>> {
  return apiPost("/auth/register", data)
}

/**
 * Logout user
 */
export async function logout(): Promise<ApiResponse<void>> {
  return apiPost("/auth/logout")
}

/**
 * Create course
 */
export async function createCourse(data: CourseFormData): Promise<ApiResponse<{ course: unknown }>> {
  return apiPost("/courses", data)
}

/**
 * Update course
 */
export async function updateCourse(
  id: number,
  data: Partial<CourseFormData>
): Promise<ApiResponse<{ course: unknown }>> {
  return apiPut(`/courses/${id}`, data)
}

/**
 * Delete course
 */
export async function deleteCourse(id: number): Promise<ApiResponse<void>> {
  return apiDelete(`/courses/${id}`)
}

