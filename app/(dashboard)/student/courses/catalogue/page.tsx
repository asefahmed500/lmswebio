"use client"

import * as React from "react"
import { BookOpen, Search } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CourseCard } from "@/features/courses/course-card"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"

type SortOption = "popular" | "newest" | "rating"
type LevelFilter = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
type CategoryFilter = "ALL" | string

interface ApiCourse {
  id: string
  title: string
  slug?: string
  description: string | null
  level: string
  category: string | null
  thumbnail: string | null
  tags: string[]
  price?: number | null
  isPublished: boolean
  createdAt: string
  instructor?: { id: string; fullName: string; avatarUrl: string | null }
  _count?: { modules: number; enrolments: number }
  modules: Array<{ id: string; lessons: Array<{ id: string }> }>
}

export default function CourseCataloguePage() {
  const { user } = useAuth()
  const [courses, setCourses] = React.useState<ApiCourse[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = React.useState<Set<string>>(
    new Set()
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("ALL")
  const [categoryFilter, setCategoryFilter] =
    React.useState<CategoryFilter>("ALL")
  const [sortBy, setSortBy] = React.useState<SortOption>("popular")

  React.useEffect(() => {
    async function loadData() {
      if (!user) return
      setIsLoading(true)
      try {
        const [coursesResult, enrollmentsResult] = await Promise.all([
          apiGet("/courses"),
          apiGet("/enrolments/my"),
        ])
        if (coursesResult.data) {
          const data = coursesResult.data
          setCourses(
            (Array.isArray(data)
              ? data
              : (data as Record<string, unknown>).courses || []) as ApiCourse[]
          )
        }
        if (enrollmentsResult.data) {
          const enrollments = enrollmentsResult.data
          const enrolled = Array.isArray(enrollments)
            ? (enrollments as { courseId: string }[]).map((e) => e.courseId)
            : (
                (enrollments as Record<string, unknown>).enrolments as
                  | { courseId: string }[]
                  | undefined
              )?.map((e) => e.courseId) || []
          setEnrolledCourseIds(new Set(enrolled))
        }
      } catch {
        console.error("Failed to load courses")
      } finally {
        const params = new URLSearchParams(window.location.search)
        const q = params.get("q") || params.get("search")
        if (q) setSearchQuery(q)
        setIsLoading(false)
      }
    }
    loadData()
  }, [user])

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
    if (levelFilter !== "ALL")
      filtered = filtered.filter((c) => c.level === levelFilter)
    if (categoryFilter !== "ALL")
      filtered = filtered.filter((c) => c.category === categoryFilter)
    filtered.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return b.id.localeCompare(a.id)
    })
    return filtered
  }, [courses, searchQuery, levelFilter, categoryFilter, sortBy])

  const categories = React.useMemo(() => {
    const cats = new Set(
      courses.map((c) => c.category).filter(Boolean) as string[]
    )
    return Array.from(cats)
  }, [courses])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Course Catalogue"
        description="Discover and enroll in courses to start learning"
      />

      {/* Filter bar — shadcn Card with Select dropdowns */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row">
            <InputGroup className="min-w-0 flex-1">
              <InputGroupInput
                type="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <div className="flex flex-wrap gap-2">
              <Select
                value={levelFilter}
                onValueChange={(value) => setLevelFilter(value as LevelFilter)}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(value) =>
                  setCategoryFilter(value as CategoryFilter)
                }
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCourses.length}{" "}
          {filteredCourses.length === 1 ? "course" : "courses"} found
        </p>
      </div>

      {/* Loading state */}
      {isLoading && <CourseGridLoading count={6} />}

      {/* Course grid */}
      {!isLoading && filteredCourses.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={{
                id: course.id,
                title: course.title,
                slug: course.slug || String(course.id),
                description: course.description || undefined,
                thumbnail: course.thumbnail || undefined,
                level: course.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                category: course.category || undefined,
                price: course.price,
                instructor: course.instructor
                  ? {
                      id: course.instructor.id,
                      fullName: course.instructor.fullName,
                      avatarUrl: course.instructor.avatarUrl ?? undefined,
                    }
                  : {
                      id: "",
                      fullName: "Instructor",
                      avatarUrl: undefined as string | undefined,
                    },
                _count: course._count || {
                  modules: course.modules.length,
                  enrolments: 0,
                },
              }}
              enrolled={enrolledCourseIds.has(course.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredCourses.length === 0 && courses.length === 0 && (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>No courses yet</EmptyTitle>
            <EmptyDescription>
              Courses will appear once instructors publish them. Check back
              soon.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && filteredCourses.length === 0 && courses.length > 0 && (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No courses found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
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
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
