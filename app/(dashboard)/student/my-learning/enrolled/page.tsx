"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CourseGridLoading } from "@/components/loading-skeleton"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="My Enrolled Courses"
          description="All courses you have enrolled in"
        />
        <CourseGridLoading count={3} />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="My Enrolled Courses"
        description="All courses you have enrolled in"
      />

      <InputGroup className="max-w-sm">
        <InputGroupInput
          type="search"
          placeholder="Search enrolled courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

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
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>
              {searchQuery ? "No matching courses" : "No enrolled courses yet"}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? "Try a different search term"
                : "Browse the catalogue to find courses to enroll in"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/student/courses/catalogue">Browse Courses</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
