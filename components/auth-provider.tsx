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

  /**
   * Guards against a stale session read overwriting a fresh authentication.
   *
   * The mount-time `fetchSession()` calls /api/auth/me and then
   * /api/auth/refresh. If the user submits the login form before that chain
   * finishes, `login()` writes the authenticated state first, and then the
   * still-in-flight `fetchSession` — whose refresh request was issued *before*
   * the login cookies existed, so it 401s — overwrites it back to
   * `{ user: null }`. AppShell then redirects to /login, bouncing the user out
   * immediately after a successful sign-in.
   *
   * `login`/`register`/`logout` bump this counter; every write inside
   * `fetchSession` is skipped when its captured sequence is no longer current.
   */
  const authSeq = React.useRef(0)

  const isStale = React.useCallback(
    (seq: number) => seq !== authSeq.current,
    []
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const seq = authSeq.current

    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/me", {
          signal: controller.signal,
        })
        const data = await res.json()
        if (isStale(seq) || controller.signal.aborted) return
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
        if (!controller.signal.aborted && !isStale(seq)) {
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
        if (isStale(seq) || controller.signal.aborted) return
        if (refreshData.user) {
          setAuthState({
            user: refreshData.user,
            isAuthenticated: true,
            isLoading: false,
          })
          return
        }
      } catch {}

      if (isStale(seq) || controller.signal.aborted) return
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
  }, [isStale])

  const login = React.useCallback(
    async (
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

        // Invalidate any in-flight mount-time session read before writing.
        authSeq.current += 1
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        })

        return { success: true, user: data.user }
      } catch {
        return { success: false, error: "An error occurred during login" }
      }
    },
    []
  )

  const register = React.useCallback(
    async (
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

        // Invalidate any in-flight mount-time session read before writing.
        authSeq.current += 1
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        })

        return { success: true, user: data.user }
      } catch {
        return {
          success: false,
          error: "An error occurred during registration",
        }
      }
    },
    []
  )

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}

    invalidateCSRFToken()

    // Drop any in-flight session read so it cannot resurrect a logged-out user.
    authSeq.current += 1
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  const setUser = React.useCallback((user: User | null) => {
    authSeq.current += 1
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    })
  }, [])

  const value = React.useMemo(
    () => ({
      ...authState,
      login,
      register,
      logout,
      setUser,
    }),
    [authState, login, register, logout, setUser]
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
