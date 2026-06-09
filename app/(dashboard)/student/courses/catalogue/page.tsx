"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Search } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CourseCard } from "@/components/course/course-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api-client"

type SortOption = "popular" | "newest" | "rating"
type LevelFilter = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
type CategoryFilter = "ALL" | string

interface ApiCourse {
  id: number
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
  instructor?: { id: number; fullName: string; avatarUrl: string | null }
  _count?: { modules: number; enrolments: number }
  modules: Array<{ id: number; lessons: Array<{ id: number }> }>
}

export default function CourseCataloguePage() {
  const router = useRouter()
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
            ? (enrollments as { courseId: number }[]).map((e) => e.courseId)
            : (
                (enrollments as Record<string, unknown>).enrolments as
                  | { courseId: number }[]
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
      return b.id - a.id
    })
    return filtered
  }, [courses, searchQuery, levelFilter, categoryFilter, sortBy])

  const handleEnroll = async (courseId: number, price?: number | null) => {
    if (price && price > 0) {
      router.push(`/student/checkout/${courseId}`)
      return
    }
    try {
      const result = await apiPost(`/courses/${courseId}/enrol`)
      if (result.data) {
        setEnrolledCourseIds((prev) => new Set(prev).add(courseId))
        router.push(`/student/courses/${courseId}`)
      }
    } catch {
      console.error("Enrolment error")
    }
  }

  const categories = React.useMemo(() => {
    const cats = new Set(
      courses.map((c) => c.category).filter(Boolean) as string[]
    )
    return Array.from(cats)
  }, [courses])

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <CardTitle className="text-2xl">Course Catalogue</CardTitle>
        <CardDescription>
          Discover and enroll in courses to start learning
        </CardDescription>
      </div>

      {/* Filter bar — shadcn Card with Select dropdowns */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCourses.length}{" "}
          {filteredCourses.length === 1 ? "course" : "courses"} found
        </p>
      </div>

      {/* Loading state — Skeleton grid */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full rounded-t-xl" />
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-48" />
              </CardContent>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                      id: 0,
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

      {/* Empty state — shadcn Card with icon + message + action */}
      {!isLoading && filteredCourses.length === 0 && courses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-4 size-12 text-muted-foreground/40" />
            <CardTitle className="mb-2">No courses yet</CardTitle>
            <CardDescription>
              Courses will appear once instructors publish them. Check back
              soon.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* No results — filtered empty */}
      {!isLoading && filteredCourses.length === 0 && courses.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 size-12 text-muted-foreground/40" />
            <CardTitle className="mb-2">No courses found</CardTitle>
            <CardDescription className="mb-6">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </CardDescription>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
