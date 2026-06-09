"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  CheckCircle2,
  Circle,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Lesson {
  id: number
  title: string
  contentType: "text" | "video" | "pdf"
  order: number
  completed?: boolean
  locked?: boolean
}

interface Module {
  id: number
  title: string
  order: number
  lessons: Lesson[]
}

interface ModuleLessonTreeProps {
  modules: Module[]
  currentLessonId?: number
  onLessonClick?: (lessonId: number) => void
  completedLessons?: Set<number>
}

export function ModuleLessonTree({
  modules,
  currentLessonId,
  onLessonClick,
  completedLessons = new Set(),
}: ModuleLessonTreeProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set(modules.map((m) => m.id))
  )

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case "video":
        return <Video className="size-4" />
      case "pdf":
        return <FileText className="size-4" />
      default:
        return <FileText className="size-4" />
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {modules.map((module) => (
        <div key={module.id} className="overflow-hidden rounded-lg border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => toggleModule(module.id)}
            className="flex h-auto w-full items-center justify-between rounded-none bg-muted/50 p-3 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              {expandedModules.has(module.id) ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              <span className="font-medium">{module.title}</span>
              <span className="text-sm text-muted-foreground">
                ({module.lessons.length} lessons)
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {module.lessons.filter((l) => completedLessons.has(l.id)).length}/
              {module.lessons.length}
            </div>
          </Button>

          {expandedModules.has(module.id) && (
            <div className="divide-y">
              {module.lessons.map((lesson) => {
                const isCompleted = completedLessons.has(lesson.id)
                const isCurrent = lesson.id === currentLessonId

                return (
                  <Button
                    type="button"
                    key={lesson.id}
                    variant="ghost"
                    onClick={() => !lesson.locked && onLessonClick?.(lesson.id)}
                    disabled={lesson.locked}
                    className={cn(
                      "flex h-auto w-full items-center gap-3 rounded-none p-3 text-left transition-colors hover:bg-muted/50",
                      isCurrent && "border-l-4 border-primary bg-primary/10",
                      lesson.locked && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {lesson.locked ? (
                      <Lock className="size-4 text-muted-foreground" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="text-success size-4" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                    {getLessonIcon(lesson.contentType)}
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        isCurrent && "font-medium"
                      )}
                    >
                      {lesson.title}
                    </span>
                    {lesson.locked && (
                      <span className="text-xs text-muted-foreground">
                        Locked
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
