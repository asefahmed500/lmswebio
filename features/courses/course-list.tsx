"use client"

import { CourseCard } from "./course-card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
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

/** Static maps so Tailwind can see every grid column class at build time. */
const gridColumns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
}
const tabletColumns: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
}
const desktopColumns: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
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
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No courses found</EmptyTitle>
          <EmptyDescription>
            Try a different search or browse the catalogue.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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

  const gridCols = cn(
    "grid gap-4 sm:gap-6",
    gridColumns[columns.mobile ?? 1],
    tabletColumns[columns.tablet ?? 2],
    desktopColumns[columns.desktop ?? 3]
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
