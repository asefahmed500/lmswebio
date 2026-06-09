import type {
  ApiResponse,
  UploadResponse,
  LoginFormData,
  RegisterFormData,
  CourseFormData,
} from "@/types/api"

let csrfTokenCache: string | null = null

async function fetchCSRFToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache

  try {
    const res = await fetch("/api/csrf-token", { credentials: "include" })
    if (!res.ok) throw new Error("Failed to fetch CSRF token")
    const data = await res.json()
    csrfTokenCache = data.token as string
    return csrfTokenCache!
  } catch (err) {
    console.error("CSRF token fetch failed:", err)
    return ""
  }
}

export function invalidateCSRFToken(): void {
  csrfTokenCache = null
}

async function csrfHeaders(): Promise<Record<string, string>> {
  const token = await fetchCSRFToken()
  return token ? { "X-CSRF-Token": token } : {}
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 403) {
    const body = await response
      .clone()
      .json()
      .catch(() => ({}))
    if (body.error === "Invalid CSRF token") {
      invalidateCSRFToken()
    }
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }))
    return { error: errorData.error || response.statusText }
  }
  return { data: await response.json() }
}

export async function apiGet<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
    })
    return handleResponse<T>(response)
  } catch (error) {
    console.error(`API GET ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

export async function apiPost<T>(
  endpoint: string,
  body?: Record<string, unknown> | FormData,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const isFormData = body instanceof FormData
    const headers = {
      ...options?.headers,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(await csrfHeaders()),
    }
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "POST",
      credentials: "include",
      headers,
      body: isFormData ? body : JSON.stringify(body),
    })
    return handleResponse<T>(response)
  } catch (error) {
    console.error(`API POST ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

export async function apiPut<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "PUT",
      credentials: "include",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
        ...(await csrfHeaders()),
      },
      body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
  } catch (error) {
    console.error(`API PUT ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

export async function apiPatch<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "PATCH",
      credentials: "include",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
        ...(await csrfHeaders()),
      },
      body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
  } catch (error) {
    console.error(`API PATCH ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

export async function apiDelete<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "DELETE",
      credentials: "include",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
        ...(await csrfHeaders()),
      },
    })
    return handleResponse<T>(response)
  } catch (error) {
    console.error(`API DELETE ${endpoint} error:`, error)
    return { error: "Network error" }
  }
}

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
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Upload failed" }))
      return { error: errorData.error || "Upload failed" }
    }

    return { data: await response.json() }
  } catch (error) {
    console.error("File upload error:", error)
    return { error: "Upload failed" }
  }
}

export async function login(
  data: LoginFormData
): Promise<ApiResponse<{ user: unknown }>> {
  return apiPost("/auth/login", data as unknown as Record<string, unknown>)
}

export async function register(
  data: RegisterFormData
): Promise<ApiResponse<{ user: unknown }>> {
  return apiPost("/auth/register", data as unknown as Record<string, unknown>)
}

export async function logout(): Promise<ApiResponse<void>> {
  return apiPost("/auth/logout")
}

export async function createCourse(
  data: CourseFormData
): Promise<ApiResponse<{ course: unknown }>> {
  return apiPost("/courses", data as unknown as Record<string, unknown>)
}

export async function updateCourse(
  id: string,
  data: Partial<CourseFormData>
): Promise<ApiResponse<{ course: unknown }>> {
  return apiPut(`/courses/${id}`, data as Record<string, unknown>)
}

export async function deleteCourse(id: string): Promise<ApiResponse<void>> {
  return apiDelete(`/courses/${id}`)
}
