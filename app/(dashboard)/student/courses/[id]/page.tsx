/**
 * Student course player page
 * Displays course content with lesson viewer and progress tracking
 */

"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle,
  Circle,
  Lock,
  BookOpen,
  Clock,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { sanitizeHtml } from "@/lib/sanitize"

interface ApiLesson {
  id: number
  title: string
  content: string | null
  contentType: string
  duration: number | null
  order: number
  moduleId: number
}

interface ApiModule {
  id: number
  title: string
  order: number
  lessons: ApiLesson[]
}

interface ApiCourse {
  id: number
  title: string
  description: string | null
  level: string
  modules: ApiModule[]
}

/**
 * Lesson item component for sidebar
 */
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
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
        "hover:bg-accent/50",
        isActive && "bg-accent",
        isLocked && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        {isLocked ? (
          <Lock className="h-4 w-4 text-muted-foreground" />
        ) : isCompleted ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium">{lesson.title}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {lesson.duration && (
            <>
              <Clock className="h-3 w-3" />
              {lesson.duration}m
            </>
          )}
          <Badge variant="outline" className="text-xs">
            {lesson.contentType}
          </Badge>
        </div>
      </div>
      {isActive && !isLocked && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}

/**
 * Video lesson player component
 */
function VideoPlayer({ url }: { url: string }) {
  return (
    <div className="aspect-video overflow-hidden rounded-lg bg-black">
      <iframe
        src={url}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

/**
 * Text lesson content component
 */
function TextContent({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  )
}

/**
 * Course player page component
 */
export default function CoursePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const courseId = parseInt(params.id as string)
  const [course, setCourse] = React.useState<ApiCourse | null>(null)
  const [activeLesson, setActiveLesson] = React.useState<ApiLesson | null>(null)
  const [completedLessons, setCompletedLessons] = React.useState<Set<number>>(
    new Set()
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Load course and enrollment data
  React.useEffect(() => {
    async function loadData() {
      if (!courseId || !user) return

      setIsLoading(true)
      try {
        const [courseRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/progress?courseId=${courseId}`),
        ])

        if (!courseRes.ok) {
          router.push("/student/courses/catalogue")
          return
        }

        const courseData = await courseRes.json()
        setCourse(courseData)

        // Load completed lessons
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          if (progressData.completedLessonIds) {
            setCompletedLessons(new Set(progressData.completedLessonIds))
          }
        }

        // Set first lesson as active if available
        if (
          courseData.modules?.length > 0 &&
          courseData.modules[0].lessons?.length > 0
        ) {
          setActiveLesson(courseData.modules[0].lessons[0])
        }
      } catch (error) {
        console.error("Failed to load course:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [courseId, user, router])

  /**
   * Calculate overall course progress
   */
  const courseProgress = React.useMemo(() => {
    if (!course) return 0

    const totalLessons = course.modules.reduce(
      (sum, m) => sum + (m.lessons?.length || 0),
      0
    )
    const completedCount = completedLessons.size

    return totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0
  }, [course, completedLessons])

  /**
   * Handle lesson completion toggle
   */
  const handleToggleComplete = async (lessonId: number) => {
    try {
      if (completedLessons.has(lessonId)) {
        // Cannot un-complete via API, just update local state
        return
      }

      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      })

      if (res.ok) {
        setCompletedLessons((prev) => new Set(prev).add(lessonId))
      }
    } catch (error) {
      console.error("Failed to mark lesson complete:", error)
    }
  }

  /**
   * Navigate to next lesson
   */
  const handleNextLesson = () => {
    if (!course || !activeLesson) return

    for (const mod of course.modules) {
      const lessonIndex = mod.lessons.findIndex((l) => l.id === activeLesson.id)
      if (lessonIndex !== -1) {
        if (lessonIndex < mod.lessons.length - 1) {
          setActiveLesson(mod.lessons[lessonIndex + 1])
          return
        }
        const moduleIndex = course.modules.findIndex((m) => m.id === mod.id)
        if (moduleIndex < course.modules.length - 1) {
          const nextModule = course.modules[moduleIndex + 1]
          if (nextModule.lessons.length > 0) {
            setActiveLesson(nextModule.lessons[0])
          }
        }
        return
      }
    }
  }

  /**
   * Navigate to previous lesson
   */
  const handlePrevLesson = () => {
    if (!course || !activeLesson) return

    for (let i = 0; i < course.modules.length; i++) {
      const mod = course.modules[i]
      const lessonIndex = mod.lessons.findIndex((l) => l.id === activeLesson.id)
      if (lessonIndex !== -1) {
        if (lessonIndex > 0) {
          setActiveLesson(mod.lessons[lessonIndex - 1])
          return
        }
        if (i > 0) {
          const prevModule = course.modules[i - 1]
          if (prevModule.lessons.length > 0) {
            setActiveLesson(prevModule.lessons[prevModule.lessons.length - 1])
          }
        }
        return
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course || !activeLesson) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Course not found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            The course you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <Button asChild>
            <Link href="/student/courses/catalogue">Browse Courses</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isLessonCompleted = completedLessons.has(activeLesson.id)

  // Sidebar content
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Course info */}
      <div className="border-b p-4">
        <h3 className="font-semibold">{course.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {course.modules.length} modules •{" "}
          {course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)} lessons
        </p>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(courseProgress)}%</span>
          </div>
          <Progress value={courseProgress} className="h-2" />
        </div>
      </div>

      {/* Modules and lessons */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id}>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="text-muted-foreground">
                  Module {moduleIndex + 1}
                </span>
                <span>{module.title}</span>
              </h4>
              <div className="space-y-1">
                {module.lessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    isCompleted={completedLessons.has(lesson.id)}
                    isLocked={false}
                    isActive={activeLesson.id === lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full">
        {/* Desktop sidebar */}
        {!isMobile && (
          <aside className="w-80 flex-shrink-0 border-r">
            {sidebarContent}
          </aside>
        )}

        {/* Mobile sidebar */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-6 p-6">
            {/* Lesson header */}
            <div>
              <Badge variant="outline" className="mb-2">
                {activeLesson.contentType}
              </Badge>
              <h1 className="text-2xl font-bold">{activeLesson.title}</h1>
              {activeLesson.duration && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {activeLesson.duration} minutes
                </p>
              )}
            </div>

            {/* Lesson content */}
            {activeLesson.contentType === "VIDEO" && activeLesson.content ? (
              <VideoPlayer url={activeLesson.content} />
            ) : activeLesson.contentType === "TEXT" && activeLesson.content ? (
              <Card>
                <CardContent className="pt-6">
                  <TextContent content={activeLesson.content} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="py-8 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      {activeLesson.contentType === "PDF"
                        ? "PDF Content"
                        : "Lesson Content"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeLesson.content
                        ? "Content available"
                        : "No content available for this lesson yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevLesson}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                variant={isLessonCompleted ? "outline" : "default"}
                onClick={() => handleToggleComplete(activeLesson.id)}
              >
                {isLessonCompleted ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </>
                )}
              </Button>

              <Button onClick={handleNextLesson}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
