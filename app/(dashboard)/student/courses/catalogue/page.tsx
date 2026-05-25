/**
 * Student course catalogue page
 * Browse and discover available courses
 */

"use client"

import * as React from "react"
import { BookOpen, Clock, Users, Star, Search } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"

type SortOption = "popular" | "newest" | "rating"
type LevelFilter = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
type CategoryFilter = "ALL" | string

interface ApiCourse {
  id: number
  title: string
  description: string | null
  level: string
  category: string | null
  thumbnail: string | null
  tags: string[]
  isPublished: boolean
  createdAt: string
  modules: Array<{
    id: number
    lessons: Array<{ id: number }>
  }>
}

/**
 * Course card component
 */
function CourseCard({
  course,
  isEnrolled,
  onEnroll,
}: {
  course: ApiCourse
  isEnrolled: boolean
  onEnroll: (courseId: number) => void
}) {
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  )

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-video w-full bg-muted">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge className="absolute top-2 right-2" variant="secondary">
          {course.level}
        </Badge>
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-1 text-base">
              {course.title}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {course.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.modules.length} modules</span>
            </div>
          </div>

          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {course.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            variant={isEnrolled ? "outline" : "default"}
            onClick={() => onEnroll(course.id)}
            disabled={isEnrolled}
          >
            {isEnrolled ? (
              <>
                <Star className="mr-2 h-4 w-4" />
                Enrolled
              </>
            ) : (
              "Enroll Now"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Course catalogue page component
 */
export default function CourseCataloguePage() {
  const { user } = useAuth()
  const [courses, setCourses] = React.useState<ApiCourse[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = React.useState<Set<number>>(
    new Set()
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("ALL")
  const [categoryFilter, setCategoryFilter] =
    React.useState<CategoryFilter>("ALL")
  const [sortBy, setSortBy] = React.useState<SortOption>("popular")

  // Load courses
  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      setIsLoading(true)
      try {
        const [coursesRes, enrollmentsRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/enrolments/my"),
        ])

        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(Array.isArray(data) ? data : data.courses || [])
        }

        if (enrollmentsRes.ok) {
          const enrollments = await enrollmentsRes.json()
          const enrolled = Array.isArray(enrollments)
            ? enrollments.map((e: any) => e.courseId)
            : enrollments.enrolments?.map((e: any) => e.courseId) || []
          setEnrolledCourseIds(new Set(enrolled))
        }
      } catch (error) {
        console.error("Failed to load courses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  // Filter and sort courses
  const filteredCourses = React.useMemo(() => {
    let filtered = [...courses]

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    }

    if (levelFilter !== "ALL") {
      filtered = filtered.filter((c) => c.level === levelFilter)
    }

    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((c) => c.category === categoryFilter)
    }

    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return b.id - a.id
    })

    return filtered
  }, [courses, searchQuery, levelFilter, categoryFilter, sortBy])

  /**
   * Handle course enrollment
   */
  const handleEnroll = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enrol`, {
        method: "POST",
      })

      if (response.ok) {
        setEnrolledCourseIds((prev) => new Set(prev).add(courseId))
        window.location.href = `/student/courses/${courseId}`
      } else {
        const data = await response.json().catch(() => ({}))
        console.error("Enrolment failed:", data.error || response.statusText)
      }
    } catch (error) {
      console.error("Enrolment error:", error)
    }
  }

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(courses.map((c) => c.category).filter(Boolean) as string[])
    return Array.from(cats)
  }, [courses])

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
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Catalogue</h1>
        <p className="mt-1 text-muted-foreground">
          Discover and enroll in courses to start learning
        </p>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={levelFilter}
                onValueChange={(value) => setLevelFilter(value as LevelFilter)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter}
                onValueChange={(value) =>
                  setCategoryFilter(value as CategoryFilter)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCourses.length}{" "}
          {filteredCourses.length === 1 ? "course" : "courses"} found
        </p>
      </div>

      {/* Course grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledCourseIds.has(course.id)}
              onEnroll={handleEnroll}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Try adjusting your search or filters to find what you&apos;re
                looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setLevelFilter("ALL")
                  setCategoryFilter("ALL")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
