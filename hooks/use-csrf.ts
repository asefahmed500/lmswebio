import { useEffect, useState, useCallback } from "react"

/**
 * Hook to manage CSRF tokens for client-side requests
 *
 * Usage:
 * 1. Call this hook to get the CSRF token
 * 2. Include the token in the X-CSRF-Token header for state-changing requests
 * 3. The hook automatically fetches a new token when needed
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/csrf-token")
      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token")
      }
      const data = await response.json()
      setToken(data.token)
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  /**
   * Get headers with CSRF token for fetch requests
   */
  const getCSRFHeaders = useCallback(() => {
    if (!token) {
      console.warn("CSRF token not available")
      return {}
    }
    return {
      "X-CSRF-Token": token,
    }
  }, [token])

  /**
   * Make a POST request with CSRF protection
   */
  const postWithCSRF = useCallback(
    async (url: string, data?: BodyInit, options?: RequestInit) => {
      if (!token) {
        throw new Error("CSRF token not available")
      }

      const response = await fetch(url, {
        ...options,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
          ...options?.headers,
        },
        body: data,
      })

      return response
    },
    [token]
  )

  /**
   * Make a PUT request with CSRF protection
   */
  const putWithCSRF = useCallback(
    async (url: string, data?: BodyInit, options?: RequestInit) => {
      if (!token) {
        throw new Error("CSRF token not available")
      }

      const response = await fetch(url, {
        ...options,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
          ...options?.headers,
        },
        body: data,
      })

      return response
    },
    [token]
  )

  /**
   * Make a DELETE request with CSRF protection
   */
  const deleteWithCSRF = useCallback(
    async (url: string, options?: RequestInit) => {
      if (!token) {
        throw new Error("CSRF token not available")
      }

      const response = await fetch(url, {
        ...options,
        method: "DELETE",
        headers: {
          "X-CSRF-Token": token,
          ...options?.headers,
        },
      })

      return response
    },
    [token]
  )

  return {
    token,
    isLoading,
    fetchToken,
    getCSRFHeaders,
    postWithCSRF,
    putWithCSRF,
    deleteWithCSRF,
  }
}
