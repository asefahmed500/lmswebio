"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle,
  Circle,
  Lock,
  Clock,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { sanitizeHtml } from "@/lib/sanitize"
import { cn } from "@/lib/utils"
import { apiGet, apiPost } from "@/lib/api-client"

interface ApiLesson {
  id: string
  title: string
  content: string | null
  contentType: string
  duration: number | null
  order: number
  moduleId: string
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
  description: string | null
  level: string
  modules: ApiModule[]
}

function LessonItem({
  lesson,
  isCompleted,
  isLocked,
  isActive,
  onClick,
}: {
  lesson: ApiLesson
  isCompleted: boolean
  isLocked: boolean
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        isActive && "bg-[var(--color-ink)] text-[var(--color-canvas)]",
        !isActive && "hover:bg-[var(--color-soft-cloud)]",
        isLocked && "cursor-not-allowed opacity-30"
      )}
    >
      <div className="shrink-0">
        {isLocked ? (
          <Lock className="size-4" />
        ) : isCompleted ? (
          <CheckCircle
            className={cn(
              "size-4",
              isActive
                ? "text-[var(--color-success-bright)]"
                : "text-[var(--color-success)]"
            )}
          />
        ) : (
          <Circle className="size-4 opacity-40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[14px] font-medium">{lesson.title}</p>
        <div
          className={cn(
            "mt-0.5 flex items-center gap-2 text-[12px]",
            isActive ? "text-white/60" : "text-[var(--color-mute)]"
          )}
        >
          <span>{lesson.contentType}</span>
          {lesson.duration && <span>· {lesson.duration}m</span>}
        </div>
      </div>
      {isActive && <ChevronRight className="size-4 shrink-0 opacity-60" />}
    </button>
  )
}

export default function CoursePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const courseId = params.id as string

  const [course, setCourse] = React.useState<ApiCourse | null>(null)
  const [activeLesson, setActiveLesson] = React.useState<ApiLesson | null>(null)
  const [completedLessons, setCompletedLessons] = React.useState<Set<string>>(
    new Set()
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEnrolled, setIsEnrolled] = React.useState(false)
  const [isEnrolling, setIsEnrolling] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    if (!courseId || !user) return
    ;(async () => {
      setIsLoading(true)
      try {
        const [cr, pr, er] = await Promise.all([
          apiGet<{ course?: ApiCourse; modules?: ApiModule[] }>(
            `/courses/${courseId}`
          ),
          apiGet<{ completedLessonIds?: string[] }>(
            `/progress?courseId=${courseId}`
          ),
          apiGet<{ courseId: string }[]>("/enrolments/my"),
        ])
        if (cr.error || !cr.data) {
          router.push("/student/courses/catalogue")
          return
        }
        const c = (cr.data.course || cr.data) as ApiCourse
        setCourse(c)
        if (!er.error && er.data) {
          setIsEnrolled(
            Array.isArray(er.data)
              ? er.data.some(
                  (e: { courseId: string }) => e.courseId === courseId
                )
              : false
          )
        }
        if (!pr.error && pr.data?.completedLessonIds) {
          setCompletedLessons(new Set(pr.data.completedLessonIds))
        }
        if (c.modules?.[0]?.lessons?.[0])
          setActiveLesson(c.modules[0].lessons[0])
      } catch {
      } finally {
        setIsLoading(false)
      }
    })()
  }, [courseId, user, router])

  const handleEnrol = async () => {
    setIsEnrolling(true)
    try {
      const r = await apiPost(`/courses/${courseId}/enrol`)
      if (!r.error) setIsEnrolled(true)
    } catch {
    } finally {
      setIsEnrolling(false)
    }
  }

  const isLessonLocked = React.useCallback(
    (lesson: ApiLesson, module: ApiModule): boolean => {
      const idx = module.lessons.findIndex((l) => l.id === lesson.id)
      if (idx <= 0) return false
      return !completedLessons.has(module.lessons[idx - 1].id)
    },
    [completedLessons]
  )

  const totalLessons =
    course?.modules.reduce((s, m) => s + m.lessons.length, 0) ?? 0
  const progress =
    totalLessons > 0 ? (completedLessons.size / totalLessons) * 100 : 0

  const handleComplete = async (lessonId: string) => {
    if (completedLessons.has(lessonId)) return
    try {
      const r = await apiPost(`/lessons/${lessonId}/complete`)
      if (!r.error) setCompletedLessons((p) => new Set(p).add(lessonId))
    } catch {}
  }

  const navigate = (dir: "next" | "prev") => {
    if (!course || !activeLesson) return
    for (let i = 0; i < course.modules.length; i++) {
      const mod = course.modules[i]
      const idx = mod.lessons.findIndex((l) => l.id === activeLesson.id)
      if (idx === -1) continue
      if (dir === "next") {
        if (idx < mod.lessons.length - 1) {
          setActiveLesson(mod.lessons[idx + 1])
          return
        }
        if (i < course.modules.length - 1 && course.modules[i + 1].lessons[0]) {
          setActiveLesson(course.modules[i + 1].lessons[0])
        }
      } else {
        if (idx > 0) {
          setActiveLesson(mod.lessons[idx - 1])
          return
        }
        if (i > 0) {
          setActiveLesson(
            course.modules[i - 1].lessons[
              course.modules[i - 1].lessons.length - 1
            ]
          )
        }
      }
      return
    }
  }

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-ink)]/20 border-t-[var(--color-ink)]" />
      </div>
    )
  if (!course || !activeLesson)
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 text-[24px] font-medium">Not found</h3>
          <Button asChild className="nike-pill bg-[var(--color-ink)]">
            <Link href="/student/courses/catalogue">Browse</Link>
          </Button>
        </div>
      </div>
    )

  if (!isEnrolled) {
    const tl = course.modules.reduce((s, m) => s + m.lessons.length, 0)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Button variant="ghost" asChild className="nike-pill-sm mb-6">
          <Link href="/student/courses/catalogue">
            <ChevronLeft /> Catalogue
          </Link>
        </Button>
        <div className="text-center">
          <h1 className="mb-3 text-[32px] font-medium">{course.title}</h1>
          <p className="mb-8 text-[var(--color-mute)]">{course.description}</p>
          <div className="mx-auto mb-8 grid max-w-sm grid-cols-2 gap-4">
            <div>
              <p className="text-[32px] font-medium">{course.modules.length}</p>
              <p className="text-[14px] text-[var(--color-mute)]">Modules</p>
            </div>
            <div>
              <p className="text-[32px] font-medium">{tl}</p>
              <p className="text-[14px] text-[var(--color-mute)]">Lessons</p>
            </div>
          </div>
          <Button
            onClick={handleEnrol}
            disabled={isEnrolling}
            className="nike-pill min-w-[200px] bg-[var(--color-ink)] text-[var(--color-canvas)]"
          >
            {isEnrolling ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {isEnrolling ? "Enrolling..." : "Enrol Now"}
          </Button>
        </div>
      </div>
    )
  }

  const isCompleted = completedLessons.has(activeLesson.id)

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-hairline)] p-5">
        <h3 className="text-[16px] font-medium">{course.title}</h3>
        <p className="mt-1 text-[14px] text-[var(--color-mute)]">
          {course.modules.length} modules · {totalLessons} lessons
        </p>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[14px]">
            <span className="text-[var(--color-mute)]">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-[3px] bg-[var(--color-soft-cloud)]">
            <div
              className="h-full bg-[var(--color-ink)]"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {course.modules.map((mod, mi) => (
            <div key={mod.id}>
              <div className="px-5 pt-5 pb-2 text-[12px] font-medium tracking-wider text-[var(--color-mute)] uppercase">
                {String(mi + 1).padStart(2, "0")} — {mod.title}
              </div>
              {mod.lessons.map((l) => (
                <LessonItem
                  key={l.id}
                  lesson={l}
                  isCompleted={completedLessons.has(l.id)}
                  isLocked={isLessonLocked(l, mod)}
                  isActive={activeLesson.id === l.id}
                  onClick={() => setActiveLesson(l)}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full">
        {!isMobile && (
          <aside className="w-80 shrink-0 border-r border-[var(--color-hairline)]">
            {sidebarContent}
          </aside>
        )}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="fixed right-4 bottom-4 z-50 size-12 rounded-full border-0 bg-[var(--color-ink)] text-[var(--color-canvas)] shadow-none"
              >
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Sidebar</SheetTitle>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6 sm:p-8">
            <div>
              <span className="text-[14px] font-medium tracking-wide text-[var(--color-mute)] uppercase">
                {activeLesson.contentType}
              </span>
              <h1 className="mt-2 text-[32px] leading-tight font-medium text-[var(--color-ink)]">
                {activeLesson.title}
              </h1>
              {activeLesson.duration && (
                <p className="mt-2 flex items-center gap-1 text-[14px] text-[var(--color-mute)]">
                  <Clock className="size-3" />
                  {activeLesson.duration} minutes
                </p>
              )}
            </div>

            {activeLesson.contentType === "video" && activeLesson.content ? (
              <div className="aspect-video overflow-hidden bg-[var(--color-ink)]">
                <iframe
                  src={activeLesson.content}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : activeLesson.contentType === "text" && activeLesson.content ? (
              <div
                className="prose prose-sm prose-headings:font-medium prose-a:underline prose-a:text-[var(--color-ink)] max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(activeLesson.content),
                }}
              />
            ) : (
              <div className="py-12 text-center text-[var(--color-mute)]">
                <p className="text-[16px]">
                  No content available for this lesson.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[var(--color-hairline)] pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("prev")}
                className="nike-pill-sm border-[var(--color-hairline)]"
              >
                <ChevronLeft /> Previous
              </Button>
              <Button
                onClick={() => handleComplete(activeLesson.id)}
                className={cn(
                  "nike-pill-sm",
                  isCompleted
                    ? "border border-[var(--color-hairline)] bg-transparent text-[var(--color-ink)]"
                    : "bg-[var(--color-ink)] text-[var(--color-canvas)]"
                )}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle /> Completed
                  </>
                ) : (
                  <>
                    <Circle /> Mark Complete
                  </>
                )}
              </Button>
              <Button
                onClick={() => navigate("next")}
                className="nike-pill-sm bg-[var(--color-ink)] text-[var(--color-canvas)]"
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
