"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, FileText, Video, FileQuestion, CheckCircle2, Circle, Lock } from "lucide-react"
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
        return <Video className="w-4 h-4" />
      case "pdf":
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-2">
      {modules.map((module) => (
        <div key={module.id} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleModule(module.id)}
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedModules.has(module.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="font-medium">{module.title}</span>
              <span className="text-sm text-muted-foreground">
                ({module.lessons.length} lessons)
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {module.lessons.filter((l) => completedLessons.has(l.id)).length}/{module.lessons.length}
            </div>
          </button>

          {expandedModules.has(module.id) && (
            <div className="divide-y">
              {module.lessons.map((lesson) => {
                const isCompleted = completedLessons.has(lesson.id)
                const isCurrent = lesson.id === currentLessonId

                return (
                  <button
                    key={lesson.id}
                    onClick={() => !lesson.locked && onLessonClick?.(lesson.id)}
                    disabled={lesson.locked}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left",
                      isCurrent && "bg-primary/10 border-l-4 border-primary",
                      lesson.locked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {lesson.locked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    {getLessonIcon(lesson.contentType)}
                    <span className={cn(
                      "flex-1 text-sm",
                      isCurrent && "font-medium"
                    )}>
                      {lesson.title}
                    </span>
                    {lesson.locked && (
                      <span className="text-xs text-muted-foreground">Locked</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
