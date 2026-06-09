"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Layers,
  Users,
  Loader2,
} from "lucide-react"
import { SynexNavbar } from "@/components/synex/Navbar"
import { HomepageFooter } from "@/components/homepage/homepage-footer"
import { useAuth } from "@/components/auth-provider"
import { apiPost } from "@/lib/api-client"

interface ApiLesson {
  id: string
  title: string
  contentType: string
  duration: number | null
  order: number
}
interface ApiModule {
  id: string
  title: string
  order: number
  lessons: ApiLesson[]
}
interface ApiCourse {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: string
  category: string | null
  price: number | null
  tags: string[]
  instructor: { id: string; fullName: string; avatarUrl: string | null }
  _count: { modules: number; enrolments: number }
  modules: ApiModule[]
}

const levelLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
}

export default function PublicCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [course, setCourse] = React.useState<ApiCourse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [enrolling, setEnrolling] = React.useState(false)
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    new Set()
  )

  React.useEffect(() => {
    let ignore = false

    async function loadCourse() {
      try {
        const res = await fetch(`/api/courses/public/${params.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (ignore) return
        setCourse(data.course)
        if (data.course.modules?.length > 0) {
          setExpandedModules(new Set([data.course.modules[0].id]))
        }
      } catch {
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    if (params.id) {
      void loadCourse()
    }

    return () => {
      ignore = true
    }
  }, [params.id])

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleEnrol() {
    if (!isAuthenticated || user?.role !== "STUDENT") {
      router.push("/login")
      return
    }
    setEnrolling(true)
    try {
      const r = await apiPost<{ checkoutUrl?: string }>(
        `/courses/${course!.id}/enrol`
      )
      if (r.error) {
        alert(r.error)
        return
      }
      if (r.data?.checkoutUrl) {
        window.location.href = r.data.checkoutUrl
        return
      }
      router.push(`/student/courses/${course!.id}`)
    } catch (err) {
      console.error(err)
      alert("Something went wrong.")
    } finally {
      setEnrolling(false)
    }
  }

  const totalLessons =
    course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0
  const totalDuration =
    course?.modules.reduce(
      (s, m) => s + m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
      0
    ) ?? 0
  const formatDuration = (m: number) =>
    m < 60
      ? `${m}m`
      : `${Math.floor(m / 60)}h ${m % 60 > 0 ? (m % 60) + "m" : ""}`

  if (loading)
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <SynexNavbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-graphite/20 border-t-void-black" />
        </div>
        <HomepageFooter />
      </div>
    )

  if (!course)
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <SynexNavbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="font-bradford text-[32px] font-medium text-void-black">
            Course Not Found
          </h1>
          <Link
            href="/"
            className="rounded-[9999px] border border-graphite/20 px-5 py-2 font-visueltpro text-sm font-light text-graphite transition-colors hover:border-graphite/40"
          >
            Back to Home
          </Link>
        </div>
        <HomepageFooter />
      </div>
    )

  const isFree = !course.price || course.price === 0

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SynexNavbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-5 py-10">
          <Link
            href="/courses"
            className="mb-8 inline-flex items-center gap-1 font-visueltpro text-sm font-light text-smoke transition-colors hover:text-void-black"
          >
            <ArrowLeft className="size-4" /> All Courses
          </Link>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
            {/* Left — image */}
            <div>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-graphite/10 bg-chalk">
                {course.thumbnail ? (
                  <Image
                    src={course.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="size-16 text-smoke/30" />
                  </div>
                )}
              </div>

              {/* Stats row below image */}
              <div className="mt-6 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-smoke" />
                  <span className="font-visueltpro text-sm font-light text-graphite">
                    {course._count.modules} modules
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-smoke" />
                  <span className="font-visueltpro text-sm font-light text-graphite">
                    {totalLessons} lessons
                  </span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-smoke" />
                    <span className="font-visueltpro text-sm font-light text-graphite">
                      {formatDuration(totalDuration)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-smoke" />
                  <span className="font-visueltpro text-sm font-light text-graphite">
                    {course._count.enrolments} students
                  </span>
                </div>
              </div>

              {/* Curriculum */}
              {course.modules.length > 0 && (
                <div className="mt-10">
                  <h2 className="mb-6 font-bradford text-[28px] font-medium tracking-[-0.02em] text-void-black">
                    Curriculum
                  </h2>
                  <div className="flex flex-col rounded-xl border border-graphite/10 bg-chalk">
                    {course.modules.map((mod, i) => {
                      const expanded = expandedModules.has(mod.id)
                      const count = mod.lessons.length
                      const dur = mod.lessons.reduce(
                        (s, l) => s + (l.duration || 0),
                        0
                      )
                      return (
                        <div
                          key={mod.id}
                          className={i > 0 ? "border-t border-graphite/10" : ""}
                        >
                          <button
                            type="button"
                            onClick={() => toggleModule(mod.id)}
                            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-canvas/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-visueltpro text-xs font-medium text-smoke">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="font-visueltpro text-sm font-medium text-void-black">
                                {mod.title}
                              </span>
                              <span className="font-visueltpro text-xs font-light text-smoke">
                                {count} lesson{count !== 1 ? "s" : ""}
                                {dur > 0 ? ` · ${formatDuration(dur)}` : ""}
                              </span>
                            </div>
                            {expanded ? (
                              <ChevronUp className="size-4 text-smoke" />
                            ) : (
                              <ChevronDown className="size-4 text-smoke" />
                            )}
                          </button>
                          {expanded && (
                            <div className="border-t border-graphite/8 bg-canvas/30 px-5 pt-3 pb-4">
                              {mod.lessons.map((lesson, j) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between py-2.5"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 font-visueltpro text-xs text-smoke">
                                      {j + 1}
                                    </span>
                                    <span className="font-visueltpro text-sm font-light text-graphite">
                                      {lesson.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="rounded-full bg-canvas px-2 py-0.5 font-visueltpro text-[10px] text-smoke">
                                      {lesson.contentType}
                                    </span>
                                    {lesson.duration && (
                                      <span className="font-visueltpro text-xs text-smoke">
                                        {formatDuration(lesson.duration)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right — info card */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-xl border border-graphite/10 bg-chalk p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {course.category && (
                    <span className="rounded-full bg-canvas px-3 py-1 font-visueltpro text-xs font-light text-graphite">
                      {course.category}
                    </span>
                  )}
                  <span className="rounded-full bg-canvas px-3 py-1 font-visueltpro text-xs font-light text-graphite">
                    {levelLabels[course.level] || course.level}
                  </span>
                </div>

                {/* Title */}
                <h1 className="mt-4 font-bradford text-[28px] leading-tight font-medium tracking-[-0.02em] text-void-black">
                  {course.title}
                </h1>

                {/* Description */}
                {course.description && (
                  <p className="mt-3 font-visueltpro text-sm leading-relaxed font-light text-smoke">
                    {course.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-6 font-visueltpro text-[28px] font-medium text-void-black">
                  {isFree ? (
                    <span className="text-smoke">Free</span>
                  ) : (
                    <span>${course.price!.toFixed(2)}</span>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={handleEnrol}
                  disabled={enrolling}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-[9999px] bg-void-black px-6 py-3 font-visueltpro text-sm font-medium text-chalk transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {enrolling && <Loader2 className="size-4 animate-spin" />}
                  {enrolling
                    ? "Processing..."
                    : isFree
                      ? "Enrol for Free"
                      : "Purchase & Enrol"}
                </button>

                {!isAuthenticated && (
                  <p className="mt-3 text-center font-visueltpro text-xs font-light text-smoke">
                    <Link
                      href="/login"
                      className="underline hover:text-void-black"
                    >
                      Log in
                    </Link>{" "}
                    to enrol
                  </p>
                )}

                {/* Instructor */}
                <div className="mt-6 flex items-center gap-3 border-t border-graphite/10 pt-5">
                  {course.instructor.avatarUrl ? (
                    <Image
                      src={course.instructor.avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-void-black font-visueltpro text-xs font-bold text-chalk">
                      {course.instructor.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-visueltpro text-sm font-medium text-void-black">
                      {course.instructor.fullName}
                    </p>
                    <p className="font-visueltpro text-xs font-light text-smoke">
                      Instructor
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5 border-t border-graphite/10 pt-4">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-graphite/10 px-2.5 py-0.5 font-visueltpro text-[11px] text-smoke"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <HomepageFooter />
    </div>
  )
}
