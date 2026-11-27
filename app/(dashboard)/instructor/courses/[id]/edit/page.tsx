/**
 * Instructor course editor page
 * Two-panel layout: course settings + module/lesson builder
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
  CircleAlert,
  Layers,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { LoadingCard } from "@/components/loading-skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { courseSchema } from "@/lib/validators"
import { Level } from "@/types"
import type { Course, Module, Lesson } from "@/types"
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api-client"

interface ApiCourse {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: string
  isPublished: boolean
  instructorId: string
  category: string | null
  tags: string[]
  modules: ApiModule[]
  createdAt: string
  updatedAt: string | null
}

interface ApiModule {
  id: string
  title: string
  order: number
  courseId: string
  lessons: ApiLesson[]
}

interface ApiLesson {
  id: string
  title: string
  content: string | null
  contentType: string
  order: number
  moduleId: string
  duration: number | null
}

function mapCourse(api: ApiCourse): Course {
  return {
    id: api.id,
    title: api.title,
    slug: api.slug,
    description: api.description ?? undefined,
    thumbnail: api.thumbnail ?? undefined,
    level: api.level as Course["level"],
    isPublished: api.isPublished,
    instructorId: api.instructorId,
    modules: api.modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      courseId: m.courseId,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content ?? undefined,
        contentType: l.contentType as "text" | "video" | "pdf",
        order: l.order,
        moduleId: l.moduleId,
        duration: l.duration ?? undefined,
      })),
    })),
    category: api.category ?? undefined,
    tags: api.tags,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt ?? undefined,
  }
}

function LessonEditor({
  lesson,
  onUpdate,
  onDelete,
}: {
  lesson: Lesson
  onUpdate: (lessonId: string, data: Partial<Lesson>) => void
  onDelete: (lessonId: string) => void
}) {
  return (
    <FieldGroup className="min-w-0 gap-3 rounded-lg border bg-card p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <Field className="min-w-0 flex-1">
          <FieldLabel>Lesson Title</FieldLabel>
          <Input
            value={lesson.title}
            onChange={(e) => onUpdate(lesson.id, { title: e.target.value })}
            placeholder="Lesson title"
          />
        </Field>
        <Button
          variant="destructive"
          size="icon-sm"
          aria-label="Delete lesson"
          onClick={() => onDelete(lesson.id)}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Content Type</FieldLabel>
          <Select
            value={lesson.contentType}
            onValueChange={(value) =>
              onUpdate(lesson.id, {
                contentType: value as "text" | "video" | "pdf",
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Duration (minutes)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={lesson.duration ?? ""}
            onChange={(e) =>
              onUpdate(lesson.id, {
                duration: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="e.g. 15"
          />
        </Field>
      </div>
      <Field>
        <FieldLabel>
          {lesson.contentType === "video" ? "Video URL" : "Content"}
        </FieldLabel>
        {lesson.contentType === "video" ? (
          <Input
            value={lesson.content ?? ""}
            onChange={(e) => onUpdate(lesson.id, { content: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        ) : (
          <Textarea
            value={lesson.content ?? ""}
            onChange={(e) => onUpdate(lesson.id, { content: e.target.value })}
            placeholder="Lesson content..."
            rows={3}
          />
        )}
      </Field>
    </FieldGroup>
  )
}

function ModuleEditor({
  module,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
}: {
  module: Module
  index: number
  onUpdate: (moduleId: string, data: Partial<Module>) => void
  onDelete: (moduleId: string) => void
  onMoveUp: (moduleId: string) => void
  onMoveDown: (moduleId: string) => void
  onAddLesson: (moduleId: string) => void
  onUpdateLesson: (
    moduleId: string,
    lessonId: string,
    data: Partial<Lesson>
  ) => void
  onDeleteLesson: (moduleId: string, lessonId: string) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {index + 1}
            </div>
            <Field className="min-w-0 flex-1">
              <FieldLabel className="sr-only">Module title</FieldLabel>
              <Input
                value={module.title}
                onChange={(e) => onUpdate(module.id, { title: e.target.value })}
                placeholder="Module title"
                className="h-8 text-base font-medium"
              />
            </Field>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Move module up"
              onClick={() => onMoveUp(module.id)}
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Move module down"
              onClick={() => onMoveDown(module.id)}
            >
              <ChevronDown />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              aria-label="Delete module"
              onClick={() => onDelete(module.id)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        <CardDescription>
          {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {module.lessons
          .sort((a, b) => a.order - b.order)
          .map((lesson) => (
            <LessonEditor
              key={lesson.id}
              lesson={lesson}
              onUpdate={(lessonId, data) =>
                onUpdateLesson(module.id, lessonId, data)
              }
              onDelete={(lessonId) => onDeleteLesson(module.id, lessonId)}
            />
          ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onAddLesson(module.id)}
        >
          <Plus data-icon="inline-start" />
          Add Lesson
        </Button>
      </CardContent>
    </Card>
  )
}

export default function InstructorCourseEditPage() {
  const params = useParams()
  const { user } = useAuth()

  const courseId = params.id as string

  const [course, setCourse] = React.useState<Course | null>(null)
  const [modules, setModules] = React.useState<Module[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")

  /**
   * Debounced persistence for the inline module/lesson editors.
   *
   * These handlers are wired straight to input onChange handlers, so the
   * original implementation issued one PUT per keystroke. Three problems:
   *   1. Overlapping requests could land out of order, leaving an intermediate
   *      keystroke persisted and silently losing the final text on reload.
   *   2. `apiPut` resolves `{ error }` and never throws, so the `catch` blocks
   *      were dead code and a 403/404/500 left the UI showing the new text as
   *      if it had saved.
   *   3. State was updated before the request, so a failure was never rolled
   *      back.
   *
   * Now: local state updates immediately (typing stays responsive), the write is
   * debounced, patches accumulate per entity so two fields edited in quick
   * succession are both persisted, and a failed write surfaces in `saveError`.
   */
  const saveTimers = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({})
  const pendingPatches = React.useRef<Record<string, Record<string, unknown>>>(
    {}
  )

  React.useEffect(() => {
    const timers = saveTimers.current
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t))
    }
  }, [])

  const queueSave = React.useCallback(
    (key: string, endpoint: string, patch: Record<string, unknown>) => {
      pendingPatches.current[key] = {
        ...(pendingPatches.current[key] ?? {}),
        ...patch,
      }

      if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
      saveTimers.current[key] = setTimeout(async () => {
        const payload = pendingPatches.current[key] ?? {}
        delete pendingPatches.current[key]
        delete saveTimers.current[key]

        const res = await apiPut(endpoint, payload)
        // apiPut resolves `{ error }`; it does not throw.
        setSaveError(res.error ?? null)
      }, 500)
    },
    []
  )

  const form = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      level: Level.BEGINNER,
      category: "",
      tags: [],
      thumbnail: "",
    },
  })

  React.useEffect(() => {
    async function loadData() {
      if (!courseId || !user) return

      setIsLoading(true)
      try {
        const res = await apiGet<{ course: ApiCourse }>(`/courses/${courseId}`)
        if (res.error) throw new Error(res.error)
        const mapped = mapCourse(res.data!.course)
        setCourse(mapped)
        setModules(mapped.modules.sort((a, b) => a.order - b.order))

        form.reset({
          title: mapped.title,
          description: mapped.description ?? "",
          level: mapped.level as Level,
          category: mapped.category ?? "",
          tags: mapped.tags ?? [],
          thumbnail: mapped.thumbnail ?? "",
        })
        setTags(mapped.tags ?? [])
      } catch (error) {
        console.error("Failed to load course:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [courseId, user, form])

  const handleSaveCourse = async () => {
    if (!course) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const data = form.getValues()
      const res = await apiPut(`/courses/${courseId}`, {
        title: data.title,
        description: data.description,
        level: data.level,
        category: data.category || undefined,
        tags,
        thumbnail: data.thumbnail || undefined,
      })

      if (res.error) {
        throw new Error(res.error || "Failed to save course")
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save course")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    if (!course) return

    try {
      const res = await apiPatch(`/courses/${courseId}`, {
        isPublished: !course.isPublished,
      })
      if (res.data) {
        setCourse((prev) =>
          prev ? { ...prev, isPublished: !prev.isPublished } : prev
        )
      }
    } catch (error) {
      console.error("Failed to toggle publish status:", error)
    }
  }

  const handleAddModule = async () => {
    try {
      const res = await apiPost(`/courses/${courseId}/modules`, {
        title: `Module ${modules.length + 1}`,
        order: modules.length,
      })
      if (res.error) throw new Error("Failed to add module")
      const newModule: ApiModule = res.data as ApiModule
      setModules((prev) => [
        ...prev,
        {
          id: newModule.id,
          title: newModule.title,
          order: newModule.order,
          courseId: newModule.courseId,
          lessons: [],
        },
      ])
    } catch (error) {
      console.error("Failed to add module:", error)
    }
  }

  const handleUpdateModule = async (
    moduleId: string,
    data: Partial<Module>
  ) => {
    // Same debounce/error handling as lessons — see queueSave.
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, ...data } : m))
    )

    queueSave(`module:${moduleId}`, `/modules/${moduleId}`, {
      ...(data as Record<string, unknown>),
    })
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const res = await apiDelete(`/modules/${moduleId}`)
      if (res.error) throw new Error("Failed to delete module")
      setModules((prev) => prev.filter((m) => m.id !== moduleId))
    } catch (error) {
      console.error("Failed to delete module:", error)
    }
  }

  const handleMoveModule = async (
    moduleId: string,
    direction: "up" | "down"
  ) => {
    // State updaters must be pure. This used to assign the persistence payload
    // to an outer `let` from inside the setModules updater; React only runs an
    // updater synchronously on its eager-state fast path, so whenever the fiber
    // already had pending lanes the updater deferred to render time and
    // `reordered` was still empty at the guard below. The reorder PUT was then
    // silently skipped while the UI showed the new order — server and client
    // disagreed until reload. The swap is now computed outside the updater.
    const index = modules.findIndex((m) => m.id === moduleId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === modules.length - 1) return

    const next = [...modules]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    const temp = next[index].order
    next[index] = { ...next[index], order: next[swapIndex].order }
    next[swapIndex] = { ...next[swapIndex], order: temp }
    next.sort((a, b) => a.order - b.order)

    setModules(next)

    const reordered = next.map((m, i) => ({ id: m.id, order: i }))
    const res = await apiPut("/modules", { modules: reordered })
    if (res.error) {
      setSaveError(res.error)
      // Restore the previous order so the UI matches the server.
      setModules(modules)
    } else {
      setSaveError(null)
    }
  }

  const handleAddLesson = async (moduleId: string) => {
    try {
      const mod = modules.find((m) => m.id === moduleId)
      const order = mod ? mod.lessons.length : 0

      const res = await apiPost("/lessons", {
        title: "New Lesson",
        moduleId,
        contentType: "text",
        content: "",
        order,
      } as Record<string, unknown>)
      if (res.error) throw new Error("Failed to add lesson")
      const newLesson = (res.data as { lesson: ApiLesson }).lesson
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: [
                  ...m.lessons,
                  {
                    id: newLesson.id,
                    title: newLesson.title,
                    content: newLesson.content ?? undefined,
                    contentType: newLesson.contentType as
                      | "text"
                      | "video"
                      | "pdf",
                    order: newLesson.order,
                    moduleId: newLesson.moduleId,
                    duration: newLesson.duration ?? undefined,
                  },
                ],
              }
            : m
        )
      )
    } catch (error) {
      console.error("Failed to add lesson:", error)
    }
  }

  const handleUpdateLesson = async (
    moduleId: string,
    lessonId: string,
    data: Partial<Lesson>
  ) => {
    // Optimistic local update keeps typing responsive; the write is debounced.
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, ...data } : l
              ),
            }
          : m
      )
    )

    queueSave(`lesson:${lessonId}`, `/lessons/${lessonId}`, {
      ...(data as Record<string, unknown>),
    })
  }

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    try {
      const res = await apiDelete(`/lessons/${lessonId}`)
      if (res.error) throw new Error("Failed to delete lesson")
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: m.lessons.filter((l) => l.id !== lessonId),
              }
            : m
        )
      )
    } catch (error) {
      console.error("Failed to delete lesson:", error)
    }
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const backButton = (
    <Button variant="ghost" size="icon" asChild aria-label="Back to course">
      <Link href={`/instructor/courses/${courseId}`}>
        <ArrowLeft />
      </Link>
    </Button>
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          {backButton}
          <PageHeader
            className="min-w-0 flex-1"
            title="Edit Course"
            description="Manage course settings and content"
          />
        </div>
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <LoadingCard count={2} />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          {backButton}
          <PageHeader className="min-w-0 flex-1" title="Course not found" />
        </div>
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlert />
            </EmptyMedia>
            <EmptyTitle>Course not found</EmptyTitle>
            <EmptyDescription>
              This course is no longer available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start gap-4">
        {backButton}
        <PageHeader
          className="min-w-0 flex-1"
          title="Edit Course"
          description="Manage course settings and content"
          action={
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/student/courses/${courseId}`}>
                  <Eye data-icon="inline-start" />
                  Preview
                </Link>
              </Button>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="publish-toggle">
                  {course.isPublished ? "Published" : "Draft"}
                </FieldLabel>
                <Switch
                  id="publish-toggle"
                  checked={course.isPublished}
                  onCheckedChange={handleTogglePublish}
                />
              </Field>
            </>
          }
        />
      </div>

      {saveError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Left panel - Course Settings */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>
                Basic information and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Course Title *</FieldLabel>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Web Development"
                    {...form.register("title")}
                  />
                  <FieldError errors={[form.formState.errors.title]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn..."
                    rows={5}
                    {...form.register("description")}
                  />
                </Field>

                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="level">Difficulty Level *</FieldLabel>
                    <Select
                      value={form.watch("level")}
                      onValueChange={(value) =>
                        form.setValue("level", value as Level)
                      }
                    >
                      <SelectTrigger id="level" className="w-full">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="BEGINNER">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="ADVANCED">Advanced</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[form.formState.errors.level]} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="category">Category</FieldLabel>
                    <Input
                      id="category"
                      placeholder="e.g., Web Development"
                      {...form.register("category")}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Tags (max 10)</FieldLabel>
                  <div className="flex min-w-0 gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      disabled={tags.length >= 10}
                      className="min-w-0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Add tag"
                      onClick={handleAddTag}
                      disabled={tags.length >= 10 || !tagInput.trim()}
                    >
                      <Plus />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveTag(tag)}
                            aria-label="Remove tag"
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="thumbnail">Thumbnail URL</FieldLabel>
                  <Input
                    id="thumbnail"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    {...form.register("thumbnail")}
                  />
                </Field>

                <Field>
                  <Button
                    onClick={handleSaveCourse}
                    disabled={isSaving}
                    className="w-fit"
                  >
                    {isSaving ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <Save data-icon="inline-start" />
                    )}
                    Save Settings
                  </Button>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Module/Lesson Builder */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle>Modules &amp; Lessons</CardTitle>
                  <CardDescription>
                    Build your course content structure
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleAddModule}>
                  <Plus data-icon="inline-start" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modules.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {modules.map((module, index) => (
                    <ModuleEditor
                      key={module.id}
                      module={module}
                      index={index}
                      onUpdate={handleUpdateModule}
                      onDelete={handleDeleteModule}
                      onMoveUp={(id) => handleMoveModule(id, "up")}
                      onMoveDown={(id) => handleMoveModule(id, "down")}
                      onAddLesson={handleAddLesson}
                      onUpdateLesson={handleUpdateLesson}
                      onDeleteLesson={handleDeleteLesson}
                    />
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Layers />
                    </EmptyMedia>
                    <EmptyTitle>No modules yet</EmptyTitle>
                    <EmptyDescription>
                      Click &quot;Add Module&quot; to get started.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
