"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle,
  Circle,
  Lock,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { DetailLoading } from "@/components/loading-skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
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
        "flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors",
        isActive && "bg-primary text-primary-foreground",
        !isActive && "hover:bg-muted",
        isLocked && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="shrink-0">
        {isLocked ? (
          <Lock className="size-4" />
        ) : isCompleted ? (
          <CheckCircle className="size-4 text-success" />
        ) : (
          <Circle className="size-4 opacity-40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium">{lesson.title}</p>
        <div
          className={cn(
            "mt-0.5 flex items-center gap-2 text-xs",
            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
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
      <div className="mx-auto flex max-w-4xl min-w-0 flex-col gap-6 p-6">
        <DetailLoading />
      </div>
    )
  if (!course || !activeLesson)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Course not found</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/student/courses/catalogue">Browse courses</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )

  if (!isEnrolled) {
    const tl = course.modules.reduce((s, m) => s + m.lessons.length, 0)
    return (
      <div className="mx-auto flex max-w-3xl min-w-0 flex-col gap-6 p-6">
        <Button variant="ghost" asChild className="self-start">
          <Link href="/student/courses/catalogue">
            <ChevronLeft data-icon="inline-start" /> Catalogue
          </Link>
        </Button>
        <PageHeader
          title={course.title}
          description={course.description ?? undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="gap-0">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-4">
              <p className="text-2xl font-semibold">{course.modules.length}</p>
            </CardContent>
          </Card>
          <Card className="gap-0">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-4">
              <p className="text-2xl font-semibold">{tl}</p>
            </CardContent>
          </Card>
        </div>
        <Button
          onClick={handleEnrol}
          disabled={isEnrolling}
          className="w-full sm:w-auto"
        >
          {isEnrolling ? <Spinner /> : null}
          {isEnrolling ? "Enrolling..." : "Enrol Now"}
        </Button>
      </div>
    )
  }

  const isCompleted = completedLessons.has(activeLesson.id)

  const sidebarContent = (
    <div className="flex min-h-0 flex-col">
      <div className="p-5">
        <h3 className="text-base font-medium">{course.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {course.modules.length} modules · {totalLessons} lessons
        </p>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <Separator className="mt-5" />
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {course.modules.map((mod, mi) => (
            <div key={mod.id}>
              <div className="px-5 pt-5 pb-2 text-xs font-medium text-muted-foreground">
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
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col lg:flex-row">
        {!isMobile && (
          <aside className="w-full shrink-0 overflow-hidden border-b border-border lg:max-h-[calc(100vh-8rem)] lg:w-80 lg:border-r lg:border-b-0">
            {sidebarContent}
          </aside>
        )}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="fixed right-4 bottom-4 z-50 rounded-full"
                aria-label="Open menu"
              >
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Sidebar</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full">{sidebarContent}</ScrollArea>
            </SheetContent>
          </Sheet>
        )}
        <main className="min-w-0 flex-1">
          <div className="mx-auto flex max-w-4xl min-w-0 flex-col gap-8 p-6 sm:p-8">
            <PageHeader
              title={activeLesson.title}
              description={
                activeLesson.duration
                  ? `${activeLesson.contentType} · ${activeLesson.duration} minutes`
                  : activeLesson.contentType
              }
            />

            {activeLesson.contentType === "video" && activeLesson.content ? (
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                <iframe
                  src={activeLesson.content}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : activeLesson.contentType === "text" && activeLesson.content ? (
              <div
                className="prose prose-sm prose-headings:font-medium prose-a:underline prose-a:text-foreground max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(activeLesson.content),
                }}
              />
            ) : (
              <Empty className="rounded-lg border border-dashed">
                <EmptyHeader>
                  <EmptyTitle>No content available</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Separator className="w-full" />
              <Button variant="outline" onClick={() => navigate("prev")}>
                <ChevronLeft data-icon="inline-start" /> Previous
              </Button>
              <Button
                variant={isCompleted ? "secondary" : "default"}
                onClick={() => handleComplete(activeLesson.id)}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle data-icon="inline-start" /> Completed
                  </>
                ) : (
                  <>
                    <Circle data-icon="inline-start" /> Mark Complete
                  </>
                )}
              </Button>
              <Button onClick={() => navigate("next")}>
                Next <ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
