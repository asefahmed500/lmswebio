"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CourseGridLoading } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { CourseCard } from "@/features/courses/course-card"
import { useEnrollments } from "@/lib/hooks/use-enrollments"

export default function ContinueLearningPage() {
  const { user } = useAuth()
  const { enrollments, isLoading } = useEnrollments(user?.id)

  const inProgressCourses = React.useMemo(() => {
    return enrollments
      .filter((e) => e.progress > 0 && e.progress < 100)
      .sort((a, b) => {
        const dateA = a.lastAccessedAt
          ? new Date(a.lastAccessedAt).getTime()
          : 0
        const dateB = b.lastAccessedAt
          ? new Date(b.lastAccessedAt).getTime()
          : 0
        return dateB - dateA
      })
  }, [enrollments])

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Continue Learning"
          description="Pick up where you left off"
        />
        <CourseGridLoading count={3} />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Continue Learning"
        description="Pick up where you left off"
      />

      {inProgressCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {inProgressCourses.map((enrollment) => {
            if (!enrollment.course) return null
            return (
              <CourseCard
                key={enrollment.id}
                course={{
                  id: enrollment.course.id,
                  title: enrollment.course.title,
                  slug: enrollment.course.slug,
                  description: enrollment.course.description || undefined,
                  thumbnail: enrollment.course.thumbnail || undefined,
                  level: enrollment.course.level,
                  category: enrollment.course.category || undefined,
                  instructor: enrollment.course.instructor
                    ? {
                        id: enrollment.course.instructor.id,
                        fullName: enrollment.course.instructor.fullName,
                        avatarUrl:
                          enrollment.course.instructor.avatarUrl || undefined,
                      }
                    : { id: "", fullName: "Instructor" },
                  _count: {
                    modules: enrollment.course.modules.length,
                    enrolments: 0,
                  },
                }}
                progress={enrollment.progress}
                enrolled={true}
                showProgress={true}
              />
            )
          })}
        </div>
      ) : (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>Start a new course!</EmptyTitle>
            <EmptyDescription>
              You have no courses in progress. Browse the catalogue and begin
              learning.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/student/courses/catalogue">
                Browse Courses
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
