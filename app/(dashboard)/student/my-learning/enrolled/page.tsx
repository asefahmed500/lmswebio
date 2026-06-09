"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { CourseCard } from "@/components/course/course-card"
import { useEnrollments } from "@/lib/hooks/use-enrollments"

export default function EnrolledCoursesPage() {
  const { user } = useAuth()
  const { enrollments, isLoading } = useEnrollments(user?.id)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredEnrollments = React.useMemo(() => {
    if (!searchQuery) return enrollments
    const q = searchQuery.toLowerCase()
    return enrollments.filter(
      (e) =>
        e.course?.title.toLowerCase().includes(q) ||
        e.course?.description?.toLowerCase().includes(q)
    )
  }, [enrollments, searchQuery])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">
            Loading enrolled courses...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          My Enrolled Courses
        </h1>
        <p className="mt-1 text-muted-foreground">
          All courses you have enrolled in
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search enrolled courses..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredEnrollments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEnrollments.map((enrollment) => {
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
              <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery
                  ? "No matching courses"
                  : "No enrolled courses yet"}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "Browse the catalogue to find courses to enroll in"}
              </p>
              <Button asChild>
                <Link href="/student/courses/catalogue">Browse Courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
