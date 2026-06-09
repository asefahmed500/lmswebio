"use client"

import * as React from "react"
import { apiGet } from "@/lib/api-client"
import type { Enrollment, Course } from "@/types"

// ---------------------------------------------------------------------------
// API shape returned by GET /api/enrolments/my
// ---------------------------------------------------------------------------

export interface ApiEnrollment {
  id: string
  userId: string
  courseId: string
  status: string
  progress: number
  lastAccessedAt: string | null
  completedAt: string | null
  enrolledAt: string
  course: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnail: string | null
    level: string
    isPublished: boolean
    instructorId: string
    instructor: {
      id: string
      fullName: string
      avatarUrl?: string | null
    } | null
    category: string | null
    tags: string[]
    modules: { id: string; lessonCount: number }[]
    createdAt: string
  }
}

// ---------------------------------------------------------------------------
// Normaliser: API shape → shared Enrollment / Course types
// ---------------------------------------------------------------------------

export function mapApiEnrollment(api: ApiEnrollment): Enrollment {
  const c = api.course
  const course: Course = {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description ?? undefined,
    thumbnail: c.thumbnail ?? undefined,
    level: c.level as Course["level"],
    isPublished: c.isPublished,
    instructorId: c.instructorId,
    instructor: c.instructor
      ? {
          id: c.instructor.id,
          email: "",
          fullName: c.instructor.fullName,
          role: "INSTRUCTOR" as const,
          avatarUrl: c.instructor.avatarUrl ?? undefined,
          createdAt: "",
        }
      : undefined,
    modules: c.modules.map((m) => ({
      id: m.id,
      title: "",
      order: 0,
      courseId: c.id,
      lessons: Array.from({ length: m.lessonCount }, (_, i) => ({
        id: String(i),
        title: "",
        contentType: "text" as const,
        order: i,
        moduleId: m.id,
      })),
    })),
    category: c.category ?? undefined,
    tags: c.tags,
    createdAt: c.createdAt,
  }
  return {
    id: api.id,
    userId: api.userId,
    courseId: api.courseId,
    status: api.status as Enrollment["status"],
    progress: api.progress,
    lastAccessedAt: api.lastAccessedAt ?? undefined,
    completedAt: api.completedAt ?? undefined,
    enrolledAt: api.enrolledAt,
    course,
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseEnrollmentsResult {
  enrollments: Enrollment[]
  isLoading: boolean
  error: string | null
}

/**
 * Fetches the current user's enrollments from the API and normalises them
 * into the shared {@link Enrollment} type.
 *
 * The hook is stable across re-renders — it will only refetch when `userId`
 * changes (e.g. on login / logout).
 */
export function useEnrollments(userId?: string): UseEnrollmentsResult {
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  // Start as false — the async fetch sets it true when it begins
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // No userId — nothing to fetch, leave loading as false
    if (!userId) return

    let cancelled = false

    async function fetchEnrollments() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await apiGet<ApiEnrollment[]>("/enrolments/my")
        if (cancelled) return

        if (res.error || !res.data) {
          setError(res.error ?? "Failed to fetch enrollments")
          return
        }

        setEnrollments(res.data.map(mapApiEnrollment))
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch enrollments"
          setError(message)
          console.error("useEnrollments:", err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchEnrollments()

    // Cleanup: prevent state updates after unmount / userId change
    return () => {
      cancelled = true
    }
  }, [userId])

  return { enrollments, isLoading, error }
}
