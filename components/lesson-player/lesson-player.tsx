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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
  const currentLesson = currentModule?.lessons.find((l) => l.id === currentLessonId)

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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    )
  }

  // Mobile navigation drawer
  const mobileNav = (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Course Content</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close course content"
        >
          <X className="h-5 w-5" />
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Mobile navigation drawer */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "fixed top-20 right-4 z-50 lg:hidden",
                "h-11 w-11 min-h-[44px] min-w-[44px]",
                "shadow-md bg-background"
              )}
              aria-label="Open course content"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            {mobileNav}
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "transition-all duration-300 border-r bg-muted/30",
            "lg:relative lg:h-screen lg:overflow-hidden",
            // Responsive sidebar width
            isSidebarOpen
              ? "w-72 xl:w-80"
              : "w-0 lg:w-16 overflow-hidden"
          )}
          aria-label="Course content sidebar"
        >
          <div className={cn("p-4", !isSidebarOpen && "lg:hidden")}>
            {isSidebarOpen && (
              <>
                <h3 className="font-semibold mb-4">Course Content</h3>
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
      <div className="flex-1 flex flex-col min-h-screen lg:h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background p-3 sm:p-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Desktop sidebar toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={isSidebarOpen}
                className="h-10 w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              >
                {isSidebarOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm sm:text-base truncate">
                {currentLesson.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
                  "h-9 sm:h-10 px-3 sm:px-4",
                  "text-xs sm:text-sm"
                )}
                aria-label="Lesson completed"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="hidden sm:inline">Completed</span>
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className={cn(
                  "gap-2",
                  "h-9 sm:h-10 px-3 sm:px-4",
                  "text-xs sm:text-sm",
                  "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                )}
                aria-label="Mark lesson as complete"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Mark Complete</span>
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" id="lesson-content">
          <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
            {/* Video player */}
            {currentLesson.contentType === "video" && currentLesson.videoUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-lg">
                <video
                  src={currentLesson.videoUrl}
                  controls
                  className="w-full h-full"
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
                <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                  {currentLesson.contentType === "video" && (
                    <>
                      <PlayCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Video Lesson</span>
                    </>
                  )}
                  {currentLesson.contentType === "text" && (
                    <>
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      <span>Text Content</span>
                    </>
                  )}
                  {currentLesson.contentType === "pdf" && (
                    <>
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      <span>PDF Document</span>
                    </>
                  )}
                  {currentLesson.duration && (
                    <>
                      <Separator orientation="vertical" className="h-4" aria-hidden="true" />
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
              <CardContent className="p-4 sm:p-6 pt-0">
                {currentLesson.contentType === "text" && currentLesson.content && (
                  <div
                    className="prose prose-slate max-w-none dark:prose-invert prose-sm sm:prose-base"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                )}
                {currentLesson.contentType === "pdf" && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm sm:text-base text-muted-foreground">
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
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => previousLesson && onLessonChange(previousLesson.id)}
              disabled={!previousLesson}
              className={cn(
                "gap-2",
                "h-9 sm:h-10 px-3 sm:px-4",
                "text-xs sm:text-sm",
                "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              )}
              aria-label="Go to previous lesson"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Progress bar - hidden on very small screens */}
            <div className="flex-1 mx-2 sm:mx-4 hidden xs:block">
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
                "h-9 sm:h-10 px-3 sm:px-4",
                "text-xs sm:text-sm",
                "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              )}
              aria-label="Go to next lesson"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
