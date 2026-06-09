"use client"

import * as React from "react"
import type { User, AuthState } from "@/types"
import { invalidateCSRFToken } from "@/lib/api-client"

type AuthContextType = AuthState & {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  React.useEffect(() => {
    const controller = new AbortController()

    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/me", {
          signal: controller.signal,
        })
        const data = await res.json()
        if (data.user) {
          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          })
          return
        }

        if (res.status !== 401) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          return
        }
      } catch {
        if (!controller.signal.aborted) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
        return
      }

      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          signal: controller.signal,
        })
        const refreshData = await refreshRes.json()
        if (refreshData.user) {
          setAuthState({
            user: refreshData.user,
            isAuthenticated: true,
            isLoading: false,
          })
          return
        }
      } catch {}

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }

    fetchSession()

    return () => {
      controller.abort()
    }
  }, [])

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" }
      }

      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true, user: data.user }
    } catch {
      return { success: false, error: "An error occurred during login" }
    }
  }

  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Registration failed",
        }
      }

      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true, user: data.user }
    } catch {
      return { success: false, error: "An error occurred during registration" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}

    invalidateCSRFToken()

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  const setUser = (user: User | null) => {
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    })
  }

  const value = React.useMemo(
    () => ({
      ...authState,
      login,
      register,
      logout,
      setUser,
    }),
    [authState]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
