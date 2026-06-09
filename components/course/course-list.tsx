"use client"

import { CourseCard } from "./course-card"
import { cn } from "@/lib/utils"

interface CourseListProps {
  courses: Array<{
    id: number
    title: string
    slug: string
    description?: string
    thumbnail?: string
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    category?: string
    tags?: string[]
    instructor: {
      id: number
      fullName: string
      avatarUrl?: string
    }
    duration?: number
    _count?: {
      modules?: number
      enrolments?: number
    }
  }>
  progress?: Record<number, number>
  enrolled?: boolean
  showProgress?: boolean
  layout?: "grid" | "list"
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

/**
 * Course list component
 * Responsive grid layout with mobile-first approach
 * - Mobile: 1 column (default) or custom
 * - Tablet: 2 columns (default) or custom
 * - Desktop: 3 columns (default) or custom
 */
export function CourseList({
  courses,
  progress = {},
  enrolled = false,
  showProgress = false,
  layout = "grid",
  columns = { mobile: 1, tablet: 2, desktop: 3 },
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">No courses found</p>
      </div>
    )
  }

  if (layout === "list") {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={progress[course.id]}
            enrolled={enrolled}
            showProgress={showProgress}
            variant="compact"
          />
        ))}
      </div>
    )
  }

  // Responsive grid with custom columns
  const gridCols = cn(
    "grid gap-4 sm:gap-6",
    `grid-cols-${columns.mobile}`,
    columns.tablet && `md:grid-cols-${columns.tablet}`,
    columns.desktop && `lg:grid-cols-${columns.desktop}`
  )

  return (
    <div
      className={gridCols}
      role="list"
      aria-label={`Course list with ${courses.length} courses`}
    >
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          progress={progress[course.id]}
          enrolled={enrolled}
          showProgress={showProgress}
        />
      ))}
    </div>
  )
}
