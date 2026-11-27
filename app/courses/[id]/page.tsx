"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Users,
} from "lucide-react"
import { SynexNavbar } from "@/components/synex/Navbar"
import { HomepageFooter } from "@/components/homepage/homepage-footer"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { DetailLoading } from "@/components/loading-skeleton"
import { Spinner } from "@/components/ui/spinner"

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
  const [alreadyEnrolled, setAlreadyEnrolled] = React.useState(false)
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    new Set()
  )

  React.useEffect(() => {
    let ignore = false

    async function loadCourse() {
      try {
        const [courseRes, enrolRes] = await Promise.all([
          apiGet<{ course: ApiCourse }>(`/courses/public/${params.id}`),
          isAuthenticated && user?.role === "STUDENT"
            ? apiGet("/enrolments/my").catch(() => null)
            : Promise.resolve(null),
        ])

        if (ignore) return
        if (courseRes.error || !courseRes.data) {
          setLoading(false)
          return
        }
        const c = courseRes.data.course
        setCourse(c)
        if (c.modules?.length > 0) {
          setExpandedModules(new Set([c.modules[0].id]))
        }

        if (enrolRes?.data) {
          const data = enrolRes.data
          const enrolled = Array.isArray(data)
            ? (data as { courseId: string }[]).some((e) => e.courseId === c.id)
            : false
          setAlreadyEnrolled(enrolled)
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
  }, [params.id, isAuthenticated, user?.role])

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
      const r = await apiPost<{
        requiresPayment?: boolean
        checkoutUrl?: string
      }>(`/courses/${course!.id}/enrol`)
      if (r.error) {
        toast.error(r.error)
        return
      }
      if (r.data?.checkoutUrl) {
        window.location.href = r.data.checkoutUrl
        return
      }
      setAlreadyEnrolled(true)
      toast.success("You're enrolled. Happy learning!")
      router.push(`/student/courses/${course!.id}`)
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong.")
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
      <div className="flex min-h-screen flex-col bg-background">
        <SynexNavbar />
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10">
          <DetailLoading />
        </div>
        <HomepageFooter />
      </div>
    )

  if (!course)
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SynexNavbar />
        <div className="flex flex-1 items-center justify-center p-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen />
              </EmptyMedia>
              <EmptyTitle>Course Not Found</EmptyTitle>
              <EmptyDescription>
                This course may have been removed or is no longer published.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
        <HomepageFooter />
      </div>
    )

  const isFree = !course.price || course.price === 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SynexNavbar />

      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-[1280px] px-5 py-10">
          <Button variant="ghost" size="sm" className="mb-8 -ml-2" asChild>
            <Link href="/courses">
              <ArrowLeft data-icon="inline-start" />
              All Courses
            </Link>
          </Button>

          <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            {/* Left — image and curriculum */}
            <div className="min-w-0">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
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
                  <div className="flex size-full items-center justify-center">
                    <BookOpen className="size-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Stats row below image */}
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="size-4 shrink-0" />
                  <span className="truncate">
                    {course._count.modules} modules
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="size-4 shrink-0" />
                  <span className="truncate">{totalLessons} lessons</span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 shrink-0" />
                    <span className="truncate">
                      {formatDuration(totalDuration)}
                    </span>
                  </div>
                )}
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4 shrink-0" />
                  <span className="truncate">
                    {course._count.enrolments} students
                  </span>
                </div>
              </div>

              {/* Curriculum */}
              {course.modules.length > 0 && (
                <section className="mt-10">
                  <h2 className="mb-6">Curriculum</h2>
                  <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                    {course.modules.map((mod, i) => {
                      const expanded = expandedModules.has(mod.id)
                      const count = mod.lessons.length
                      const dur = mod.lessons.reduce(
                        (s, l) => s + (l.duration || 0),
                        0
                      )
                      return (
                        <div key={mod.id} className="min-w-0">
                          {i > 0 && <Separator />}
                          <button
                            type="button"
                            onClick={() => toggleModule(mod.id)}
                            aria-expanded={expanded}
                            className="flex w-full min-w-0 items-center gap-3 px-5 py-4 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/25"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                                  {mod.title}
                                </span>
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {count} lesson{count !== 1 ? "s" : ""}
                                {dur > 0 ? ` · ${formatDuration(dur)}` : ""}
                              </span>
                            </span>
                            {expanded ? (
                              <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                            )}
                          </button>
                          {expanded && (
                            <div className="bg-muted/40 px-5 pt-3 pb-4">
                              {mod.lessons.map((lesson, j) => (
                                <div
                                  key={lesson.id}
                                  className="flex min-w-0 items-center justify-between gap-3 py-2.5"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className="w-5 shrink-0 text-xs text-muted-foreground">
                                      {j + 1}
                                    </span>
                                    <span className="min-w-0 truncate text-sm text-muted-foreground">
                                      {lesson.title}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-3">
                                    <Badge
                                      variant="secondary"
                                      className="font-mono"
                                    >
                                      {lesson.contentType}
                                    </Badge>
                                    {lesson.duration && (
                                      <span className="text-xs text-muted-foreground">
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
                </section>
              )}
            </div>

            {/* Right — info card */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    {course.category && (
                      <Badge variant="secondary">{course.category}</Badge>
                    )}
                    <Badge variant="secondary">
                      {levelLabels[course.level] || course.level}
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-2xl leading-tight">
                    {course.title}
                  </CardTitle>
                  {course.description && (
                    <CardDescription className="leading-relaxed">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="text-2xl font-semibold">
                    {isFree ? (
                      <span className="text-muted-foreground">Free</span>
                    ) : (
                      <span>${course.price!.toFixed(2)}</span>
                    )}
                  </div>

                  {alreadyEnrolled ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/student/courses/${course.id}`}>
                        Go to Course
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleEnrol}
                      disabled={enrolling}
                    >
                      {enrolling && <Spinner />}
                      {enrolling
                        ? "Processing..."
                        : isFree
                          ? "Enrol for Free"
                          : "Purchase & Enrol"}
                    </Button>
                  )}

                  {!isAuthenticated && (
                    <p className="-mt-2 text-center text-xs text-muted-foreground">
                      <Link
                        href="/login"
                        className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                      >
                        Log in
                      </Link>{" "}
                      to enrol
                    </p>
                  )}

                  <Separator />

                  {/* Instructor */}
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="lg">
                      {course.instructor.avatarUrl ? (
                        <AvatarImage
                          src={course.instructor.avatarUrl}
                          alt={course.instructor.fullName}
                        />
                      ) : (
                        <AvatarFallback>
                          {course.instructor.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {course.instructor.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Instructor
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-1.5">
                        {course.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <HomepageFooter />
    </div>
  )
}
