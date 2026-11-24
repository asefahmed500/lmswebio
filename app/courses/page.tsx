"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Search } from "lucide-react"
import { CourseCard } from "@/features/courses/course-card"
import { SynexNavbar } from "@/components/synex/Navbar"
import { HomepageFooter } from "@/components/homepage/homepage-footer"
import { useAuth } from "@/components/auth-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export default function PublicCoursesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
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
        const res = await fetch(`/api/courses/public?${p}`)
        if (res.ok) {
          const data = await res.json()
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
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, category, level, search])

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

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SynexNavbar />

      <main id="main-content" className="flex-1">
        <div className="border-b border-graphite/10 py-12">
          <div className="mx-auto max-w-[1280px] px-5">
            <div className="mb-8">
              <h1 className="font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
                Course Catalog
              </h1>
              <p className="mt-2 font-visueltpro text-[15px] font-light text-smoke">
                Browse {total} courses from expert instructors
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-smoke" />
                <Input
                  type="search"
                  aria-label="Search courses"
                  placeholder="Search courses..."
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch(e)
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v)
                  setPage(1)
                }}
              >
                <SelectTrigger
                  aria-label="Filter by category"
                  className="w-[180px]"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
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
                  className="w-[160px]"
                >
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-5 py-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-graphite/10 bg-chalk"
                >
                  <div className="aspect-[4/3] bg-canvas" />
                  <div className="p-5">
                    <div className="mb-2 h-3 w-16 rounded bg-canvas" />
                    <div className="mb-2 h-4 w-full rounded bg-canvas" />
                    <div className="h-3 w-3/4 rounded bg-canvas" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="mb-4 size-16 text-smoke/20" />
              <h2 className="font-bradford text-[24px] font-medium text-void-black">
                No courses found
              </h2>
              <p className="mt-2 font-visueltpro text-sm font-light text-smoke">
                {search || category !== "all" || level !== "all"
                  ? "Try adjusting your filters."
                  : "Courses will appear once instructors publish them."}
              </p>
              {(search || category !== "all" || level !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchDraft("")
                    setSearch("")
                    setCategory("all")
                    setLevel("all")
                    setPage(1)
                  }}
                  className="mt-4 rounded-md border border-graphite/20 px-3 py-1.5 font-visueltpro text-sm text-graphite transition-colors hover:border-graphite/40"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="mb-6 font-visueltpro text-sm font-light text-smoke">
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
                <div className="mt-10 flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg px-3 py-2 font-visueltpro text-sm text-smoke transition-colors hover:text-void-black disabled:opacity-30"
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
                          <span className="px-1 font-visueltpro text-sm text-smoke">
                            ...
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage(p)}
                          className={`rounded-lg px-3 py-2 font-visueltpro text-sm transition-colors ${
                            p === page
                              ? "bg-void-black text-chalk"
                              : "text-smoke hover:text-void-black"
                          }`}
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
                    className="rounded-lg px-3 py-2 font-visueltpro text-sm text-smoke transition-colors hover:text-void-black disabled:opacity-30"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <HomepageFooter />
    </div>
  )
}
