"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  FileText,
  X,
  Menu,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ModuleLessonTree } from "@/components/course/module-lesson-tree"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useMediaQuery, Breakpoint } from "@/lib/utils/responsive"
import { cn } from "@/lib/utils"

interface Lesson {
  id: number
  title: string
  content?: string
  contentType: "text" | "video" | "pdf"
  order: number
  videoUrl?: string
  duration?: number
}

interface Module {
  id: number
  title: string
  order: number
  lessons: Lesson[]
}

interface LessonPlayerProps {
  courseId: number
  modules: Module[]
  currentLessonId: number
  completedLessons: Set<number>
  onCompleteLesson: (lessonId: number) => void
  onLessonChange: (lessonId: number) => void
}

/**
 * Lesson player component
 * Fully responsive with mobile-optimized video player and navigation
 * - Desktop: Side-by-side layout with collapsible sidebar
 * - Mobile: Full-screen content with drawer navigation
 */
export function LessonPlayer({
  courseId,
  modules,
  currentLessonId,
  completedLessons,
  onCompleteLesson,
  onLessonChange,
}: LessonPlayerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isMobile = useMediaQuery("lg" as Breakpoint)
  const isTablet = useMediaQuery("xl" as Breakpoint)

  const currentModule = modules.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId)
  )
  const currentLesson = currentModule?.lessons.find(
    (l) => l.id === currentLessonId
  )

  const allLessons = modules.flatMap((m) => m.lessons)
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId)
  const previousLesson = allLessons[currentIndex - 1]
  const nextLesson = allLessons[currentIndex + 1]

  const isCompleted = completedLessons.has(currentLessonId)

  const handleComplete = async () => {
    await onCompleteLesson(currentLessonId)
  }

  if (!currentLesson) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    )
  }

  // Mobile navigation drawer
  const mobileNav = (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close course content"
        >
          <X />
        </Button>
      </div>
      <ModuleLessonTree
        modules={modules}
        currentLessonId={currentLessonId}
        onLessonClick={(id) => {
          onLessonChange(id)
          setIsSidebarOpen(false)
        }}
        completedLessons={completedLessons}
      />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Mobile navigation drawer */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "fixed top-20 right-4 z-50 lg:hidden",
                "h-11 min-h-[44px] w-11 min-w-[44px]",
                "bg-background shadow-md"
              )}
              aria-label="Open course content"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>Course Content</SheetTitle>
            </SheetHeader>
            {mobileNav}
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "border-r bg-muted/30 transition-all duration-300",
            "lg:relative lg:h-screen lg:overflow-hidden",
            // Responsive sidebar width
            isSidebarOpen ? "w-72 xl:w-80" : "w-0 overflow-hidden lg:w-16"
          )}
          aria-label="Course content sidebar"
        >
          <div className={cn("p-4", !isSidebarOpen && "lg:hidden")}>
            {isSidebarOpen && (
              <>
                <h3 className="mb-4 font-semibold">Course Content</h3>
                <ModuleLessonTree
                  modules={modules}
                  currentLessonId={currentLessonId}
                  onLessonClick={onLessonChange}
                  completedLessons={completedLessons}
                />
              </>
            )}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden lg:h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background p-3 sm:p-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            {/* Desktop sidebar toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={isSidebarOpen}
                className="h-10 min-h-[44px] w-10 min-w-[44px] sm:min-h-0 sm:min-w-0"
              >
                {isSidebarOpen ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <List className="size-4" />
                )}
              </Button>
            )}

            {/* Title */}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold sm:text-base">
                {currentLesson.title}
              </h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {currentModule?.title}
              </p>
            </div>
          </div>

          {/* Complete button */}
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <Button
                variant="outline"
                disabled
                className={cn(
                  "gap-2",
                  "h-9 px-3 sm:h-10 sm:px-4",
                  "text-xs sm:text-sm"
                )}
                aria-label="Lesson completed"
              >
                <CheckCircle2 className="text-success size-4" />
                <span className="hidden sm:inline">Completed</span>
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className={cn(
                  "gap-2",
                  "h-9 px-3 sm:h-10 sm:px-4",
                  "text-xs sm:text-sm",
                  "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                )}
                aria-label="Mark lesson as complete"
              >
                <CheckCircle2 className="size-4" />
                <span className="hidden sm:inline">Mark Complete</span>
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" id="lesson-content">
          <div className="mx-auto max-w-4xl p-3 sm:p-4 lg:p-6">
            {/* Video player */}
            {currentLesson.contentType === "video" &&
              currentLesson.videoUrl && (
                <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-black shadow-lg sm:mb-6">
                  <video
                    src={currentLesson.videoUrl}
                    controls
                    className="h-full w-full"
                    preload="metadata"
                    aria-label={`Video: ${currentLesson.title}`}
                  >
                    <track kind="captions" src="" label="English" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

            {/* Lesson info card */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {currentLesson.contentType === "video" && (
                    <>
                      <PlayCircle className="size-4" aria-hidden="true" />
                      <span>Video Lesson</span>
                    </>
                  )}
                  {currentLesson.contentType === "text" && (
                    <>
                      <FileText className="size-4" aria-hidden="true" />
                      <span>Text Content</span>
                    </>
                  )}
                  {currentLesson.contentType === "pdf" && (
                    <>
                      <FileText className="size-4" aria-hidden="true" />
                      <span>PDF Document</span>
                    </>
                  )}
                  {currentLesson.duration && (
                    <>
                      <Separator
                        orientation="vertical"
                        className="h-4"
                        aria-hidden="true"
                      />
                      <span>
                        {Math.floor(currentLesson.duration / 60)} minutes
                      </span>
                    </>
                  )}
                </div>
                <CardTitle className="text-xl sm:text-2xl">
                  {currentLesson.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6">
                {currentLesson.contentType === "text" &&
                  currentLesson.content && (
                    <div
                      className="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: currentLesson.content,
                      }}
                    />
                  )}
                {currentLesson.contentType === "pdf" && (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-4 size-12 text-muted-foreground sm:size-16" />
                    <p className="text-sm text-muted-foreground sm:text-base">
                      PDF viewer coming soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="border-t bg-background p-3 sm:p-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 sm:gap-4">
            <Button
              variant="outline"
              onClick={() =>
                previousLesson && onLessonChange(previousLesson.id)
              }
              disabled={!previousLesson}
              className={cn(
                "gap-2",
                "h-9 px-3 sm:h-10 sm:px-4",
                "text-xs sm:text-sm",
                "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              )}
              aria-label="Go to previous lesson"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Progress bar - hidden on very small screens */}
            <div className="xs:block mx-2 hidden flex-1 sm:mx-4">
              <Progress
                value={(completedLessons.size / allLessons.length) * 100}
                className="h-2"
                aria-label={`Course progress: ${completedLessons.size} of ${allLessons.length} lessons completed`}
              />
            </div>

            <Button
              onClick={() => nextLesson && onLessonChange(nextLesson.id)}
              disabled={!nextLesson}
              className={cn(
                "gap-2",
                "h-9 px-3 sm:h-10 sm:px-4",
                "text-xs sm:text-sm",
                "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              )}
              aria-label="Go to next lesson"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
