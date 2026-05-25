/**
 * Instructor course editor page
 * Two-panel layout: course settings + module/lesson builder
 */

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { courseSchema, type CourseFormData } from "@/lib/validators"
import { Level } from "@/types"
import type { Course, Module, Lesson } from "@/types"

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
    id: api.id as unknown as number,
    title: api.title,
    slug: api.slug,
    description: api.description ?? undefined,
    thumbnail: api.thumbnail ?? undefined,
    level: api.level as Course["level"],
    isPublished: api.isPublished,
    instructorId: api.instructorId as unknown as number,
    modules: api.modules.map((m) => ({
      id: m.id as unknown as number,
      title: m.title,
      order: m.order,
      courseId: m.courseId as unknown as number,
      lessons: m.lessons.map((l) => ({
        id: l.id as unknown as number,
        title: l.title,
        content: l.content ?? undefined,
        contentType: l.contentType as "text" | "video" | "pdf",
        order: l.order,
        moduleId: l.moduleId as unknown as number,
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
  moduleId,
  onUpdate,
  onDelete,
}: {
  lesson: Lesson
  moduleId: number
  onUpdate: (lessonId: number, data: Partial<Lesson>) => void
  onDelete: (lessonId: number) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Label>Lesson Title</Label>
          <Input
            value={lesson.title}
            onChange={(e) => onUpdate(lesson.id, { title: e.target.value })}
            placeholder="Lesson title"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mt-6 text-destructive"
          onClick={() => onDelete(lesson.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Content Type</Label>
          <Select
            value={lesson.contentType}
            onValueChange={(value) =>
              onUpdate(lesson.id, {
                contentType: value as "text" | "video" | "pdf",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
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
        </div>
      </div>
      <div className="space-y-2">
        <Label>
          {lesson.contentType === "video" ? "Video URL" : "Content"}
        </Label>
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
      </div>
    </div>
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
  onUpdate: (moduleId: number, data: Partial<Module>) => void
  onDelete: (moduleId: number) => void
  onMoveUp: (moduleId: number) => void
  onMoveDown: (moduleId: number) => void
  onAddLesson: (moduleId: number) => void
  onUpdateLesson: (moduleId: number, lessonId: number, data: Partial<Lesson>) => void
  onDeleteLesson: (moduleId: number, lessonId: number) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {index + 1}
            </div>
            <div className="flex-1">
              <Input
                value={module.title}
                onChange={(e) => onUpdate(module.id, { title: e.target.value })}
                placeholder="Module title"
                className="h-8 text-base font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMoveUp(module.id)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMoveDown(module.id)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(module.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {module.lessons
          .sort((a, b) => a.order - b.order)
          .map((lesson) => (
            <LessonEditor
              key={lesson.id}
              lesson={lesson}
              moduleId={module.id}
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
          <Plus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </CardContent>
    </Card>
  )
}

export default function InstructorCourseEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const courseId = params.id as string

  const [course, setCourse] = React.useState<Course | null>(null)
  const [modules, setModules] = React.useState<Module[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")

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
        const res = await fetch(`/api/courses/${courseId}`)
        if (!res.ok) throw new Error("Failed to fetch course")
        const data: ApiCourse = await res.json()
        const mapped = mapCourse(data)
        setCourse(mapped)
        setModules(
          mapped.modules.sort((a, b) => a.order - b.order)
        )

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
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          level: data.level,
          category: data.category || undefined,
          tags,
          thumbnail: data.thumbnail || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save course")
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save course"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    if (!course) return

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      })
      if (res.ok) {
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
      const res = await fetch(`/api/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Module ${modules.length + 1}`,
          order: modules.length,
        }),
      })
      if (!res.ok) throw new Error("Failed to add module")
      const newModule: ApiModule = await res.json()
      setModules((prev) => [
        ...prev,
        {
          id: newModule.id as unknown as number,
          title: newModule.title,
          order: newModule.order,
          courseId: newModule.courseId as unknown as number,
          lessons: [],
        },
      ])
    } catch (error) {
      console.error("Failed to add module:", error)
    }
  }

  const handleUpdateModule = async (moduleId: number, data: Partial<Module>) => {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, ...data } : m))
    )

    try {
      await fetch(`/api/modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error("Failed to update module:", error)
    }
  }

  const handleDeleteModule = async (moduleId: number) => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete module")
      setModules((prev) => prev.filter((m) => m.id !== moduleId))
    } catch (error) {
      console.error("Failed to delete module:", error)
    }
  }

  const handleMoveModule = (moduleId: number, direction: "up" | "down") => {
    setModules((prev) => {
      const index = prev.findIndex((m) => m.id === moduleId)
      if (index === -1) return prev
      if (direction === "up" && index === 0) return prev
      if (direction === "down" && index === prev.length - 1) return prev

      const next = [...prev]
      const swapIndex = direction === "up" ? index - 1 : index + 1
      const temp = next[index].order
      next[index] = { ...next[index], order: next[swapIndex].order }
      next[swapIndex] = { ...next[swapIndex], order: temp }
      next.sort((a, b) => a.order - b.order)
      return next
    })
  }

  const handleAddLesson = async (moduleId: number) => {
    try {
      const module = modules.find((m) => m.id === moduleId)
      const order = module ? module.lessons.length : 0

      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Lesson",
          moduleId: moduleId.toString(),
          contentType: "text",
          content: "",
          order,
        }),
      })
      if (!res.ok) throw new Error("Failed to add lesson")
      const newLesson: ApiLesson = await res.json()
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: [
                  ...m.lessons,
                  {
                    id: newLesson.id as unknown as number,
                    title: newLesson.title,
                    content: newLesson.content ?? undefined,
                    contentType: newLesson.contentType as "text" | "video" | "pdf",
                    order: newLesson.order,
                    moduleId: newLesson.moduleId as unknown as number,
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
    moduleId: number,
    lessonId: number,
    data: Partial<Lesson>
  ) => {
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

    try {
      await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error("Failed to update lesson:", error)
    }
  }

  const handleDeleteLesson = async (moduleId: number, lessonId: number) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete lesson")
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading course editor...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Course not found</p>
          <Button className="mt-4" asChild>
            <a href="/instructor/courses">Back to Courses</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <a href={`/instructor/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
            <p className="mt-1 text-muted-foreground">
              Manage course settings and content
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/student/courses/${courseId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </a>
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="publish-toggle" className="text-sm">
              {course.isPublished ? "Published" : "Draft"}
            </Label>
            <Switch
              id="publish-toggle"
              checked={course.isPublished}
              onCheckedChange={handleTogglePublish}
            />
          </div>
        </div>
      </div>

      {saveError && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left panel - Course Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>
                Basic information and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Web Development"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn..."
                  rows={5}
                  {...form.register("description")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="level">Difficulty Level *</Label>
                  <Select
                    value={form.watch("level")}
                    onValueChange={(value) =>
                      form.setValue("level", value as Level)
                    }
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.level && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.level.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Web Development"
                    {...form.register("category")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (max 10)</Label>
                <div className="flex gap-2">
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
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={tags.length >= 10 || !tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="rounded-full p-0.5 hover:bg-destructive/20"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...form.register("thumbnail")}
                />
              </div>

              <Button onClick={handleSaveCourse} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Module/Lesson Builder */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modules &amp; Lessons</CardTitle>
                  <CardDescription>
                    Build your course content structure
                  </CardDescription>
                </div>
                <Button onClick={handleAddModule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modules.length > 0 ? (
                <div className="space-y-4">
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
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No modules yet. Click &quot;Add Module&quot; to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
