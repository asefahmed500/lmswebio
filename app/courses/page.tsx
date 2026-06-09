"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Search } from "lucide-react"
import { CourseCard } from "@/components/course/course-card"
import { SynexNavbar } from "@/components/synex/Navbar"
import { HomepageFooter } from "@/components/homepage/homepage-footer"
import { useAuth } from "@/components/auth-provider"

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
  const [search, setSearch] = React.useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("q") || params.get("search") || ""
    }
    return ""
  })
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
  }, [page, category, level])

  function handleSearch() {
    setPage(1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SynexNavbar />

      <main className="flex-1">
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
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-11 w-full rounded-xl border border-graphite/15 bg-chalk pr-4 pl-10 font-visueltpro text-sm font-light text-void-black transition-colors outline-none placeholder:text-smoke focus:border-graphite/30"
                />
              </div>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                className="h-11 rounded-xl border border-graphite/15 bg-chalk px-4 font-visueltpro text-sm font-light text-graphite outline-none focus:border-graphite/30"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value)
                  setPage(1)
                }}
                className="h-11 rounded-xl border border-graphite/15 bg-chalk px-4 font-visueltpro text-sm font-light text-graphite outline-none focus:border-graphite/30"
              >
                <option value="all">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <button
                onClick={handleSearch}
                className="rounded-[9999px] bg-void-black px-6 py-2.5 font-visueltpro text-sm font-medium text-chalk transition-opacity hover:opacity-90"
              >
                Search
              </button>
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
                <button
                  onClick={() => {
                    setSearch("")
                    setCategory("all")
                    setLevel("all")
                    setPage(1)
                  }}
                  className="mt-4 rounded-[9999px] border border-graphite/20 px-5 py-2 font-visueltpro text-sm font-light text-graphite transition-colors hover:border-graphite/40"
                >
                  Clear Filters
                </button>
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
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg px-3 py-2 font-visueltpro text-sm text-smoke transition-colors hover:text-void-black disabled:opacity-30"
                  >
                    Previous
                  </button>
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
                        <button
                          onClick={() => setPage(p)}
                          className={`rounded-lg px-3 py-2 font-visueltpro text-sm transition-colors ${
                            p === page
                              ? "bg-void-black text-chalk"
                              : "text-smoke hover:text-void-black"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg px-3 py-2 font-visueltpro text-sm text-smoke transition-colors hover:text-void-black disabled:opacity-30"
                  >
                    Next
                  </button>
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
