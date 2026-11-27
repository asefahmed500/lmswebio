"use client"

import * as React from "react"
import { BookOpen, Search } from "lucide-react"
import { CourseCard } from "@/features/courses/course-card"
import { PromotionList } from "@/features/promotions/promotion-list"
import { SynexNavbar } from "@/components/synex/Navbar"
import { apiGet } from "@/lib/api-client"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { HomepageFooter } from "@/components/homepage/homepage-footer"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CourseGridLoading } from "@/components/loading-skeleton"

interface ApiCourse {
  id: number
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  category: string | null
  price: number | null
  instructor: { id: number; fullName: string; avatarUrl: string | null }
  _count: { modules: number; enrolments: number }
}

interface PublicCoursesResponse {
  courses?: ApiCourse[]
  pagination?: { pages?: number; total?: number }
}

export default function PublicCoursesPage() {
  const [courses, setCourses] = React.useState<ApiCourse[]>([])
  const [loading, setLoading] = React.useState(true)

  // Two values: `searchDraft` is the controlled input, `search` is the applied
  // query the fetch effect depends on. Previously the input wrote straight into
  // `search` while the effect's dependency array was `[page, category, level]`
  // and handleSearch only called setPage(1) — so on page 1 React bailed on the
  // identical state and never refetched. Typing in the search box did nothing.
  //
  // ?q= / ?search= on the URL seeds both values, so a link from the command
  // palette or navbar lands on a filtered catalogue. A lazy initializer is used
  // rather than an effect because an effect calling setState synchronously
  // triggers a cascading render.
  function initialSearchFromUrl(): string {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("q") || params.get("search") || ""
    }
    return ""
  }
  const [searchDraft, setSearchDraft] = React.useState(initialSearchFromUrl)
  const [search, setSearch] = React.useState(initialSearchFromUrl)
  const [category, setCategory] = React.useState("all")
  const [level, setLevel] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [categories, setCategories] = React.useState<string[]>([])

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const p = new URLSearchParams()
        p.set("page", page.toString())
        p.set("limit", "20")
        if (search) p.set("search", search)
        if (category !== "all") p.set("category", category)
        if (level !== "all") p.set("level", level)
        const res = await apiGet<PublicCoursesResponse>(
          `/courses/public?${p.toString()}`
        )
        if (res.error || !res.data) return
        const data = res.data
        setCourses(data.courses || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotal(data.pagination?.total || 0)
        if (!categories.length) {
          const cats = [
            ...new Set(
              data.courses?.map((c: ApiCourse) => c.category).filter(Boolean)
            ),
          ] as string[]
          if (cats.length) setCategories(cats)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [page, category, level, search, categories.length])

  // Adopt ?q= / ?search= from the URL on first mount, so a link from the
  // command palette or navbar lands on a filtered catalogue. This is a lazy
  // state initializer rather than an effect: an effect calling setState
  // synchronously triggers a cascading render, which the React Compiler lint
  // rejects.
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchDraft.trim())
    setPage(1)
  }

  const hasFilters = Boolean(search) || category !== "all" || level !== "all"

  function clearFilters() {
    setSearchDraft("")
    setSearch("")
    setCategory("all")
    setLevel("all")
    setPage(1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SynexNavbar />

      <main id="main-content" className="flex-1">
        <div className="border-b border-border py-12">
          <div className="mx-auto max-w-[1280px] px-5">
            <PageHeader
              title="Course Catalog"
              description={`Browse ${total} courses from expert instructors`}
            />

            <form
              onSubmit={handleSearch}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <InputGroup className="h-9 min-w-0 flex-1">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  aria-label="Search courses"
                  placeholder="Search courses..."
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                />
              </InputGroup>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v)
                  setPage(1)
                }}
              >
                <SelectTrigger
                  aria-label="Filter by category"
                  className="w-full sm:w-[180px]"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={level}
                onValueChange={(v) => {
                  setLevel(v)
                  setPage(1)
                }}
              >
                <SelectTrigger
                  aria-label="Filter by level"
                  className="w-full sm:w-[160px]"
                >
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-5 py-10">
          {loading ? (
            <CourseGridLoading count={8} />
          ) : courses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>No courses found</EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? "Try adjusting your filters."
                    : "Courses will appear once instructors publish them."}
                </EmptyDescription>
              </EmptyHeader>
              {hasFilters && (
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <>
              <p className="mb-6 text-sm text-muted-foreground">
                Showing {courses.length} of {total} courses
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={{
                      id: course.id,
                      title: course.title,
                      slug: course.slug,
                      description: course.description || undefined,
                      thumbnail: course.thumbnail || undefined,
                      level: course.level,
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
                            avatarUrl: undefined,
                          },
                      _count: course._count,
                    }}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="Course pages"
                  className="mt-10 flex flex-wrap items-center justify-center gap-1"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 || p === totalPages || Math.abs(p - page) <= 2
                    )
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-1 text-sm text-muted-foreground">
                            ...
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant={p === page ? "default" : "ghost"}
                          onClick={() => setPage(p)}
                          aria-current={p === page ? "page" : undefined}
                        >
                          {p}
                        </Button>
                      </React.Fragment>
                    ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>

        <div className="mt-12">
          <PromotionList />
        </div>
      </main>

      <HomepageFooter />
    </div>
  )
}
