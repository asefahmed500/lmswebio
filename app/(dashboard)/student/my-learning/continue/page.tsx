"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { CourseCard } from "@/components/course/course-card"
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
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Continue Learning</h1>
        <p className="mt-1 text-muted-foreground">Pick up where you left off</p>
      </div>

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
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Start a new course!
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                You have no courses in progress. Browse the catalogue and begin
                learning.
              </p>
              <Button asChild>
                <Link href="/student/courses/catalogue">
                  Browse Courses
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
