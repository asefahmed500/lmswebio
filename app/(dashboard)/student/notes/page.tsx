/**
 * Student Notes Page
 * View and manage lesson notes
 */

"use client"

import * as React from "react"
import { Bookmark, CircleAlert, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { NotesEditor } from "@/features/learning/notes/notes-editor"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingCard } from "@/components/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { useDebounced } from "@/hooks/use-media-query"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client"

interface Note {
  id: number
  content: string
  timestamp: number | null
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  lessonId: number
  lesson: {
    id: number
    title: string
    module: {
      title: string
      courseId: number
    }
  }
}

interface EnrolledCourse {
  courseId: number
  course: {
    id: number
    title: string
    modules: Array<{
      id: number
      title: string
      lessons: Array<{ id: number; title: string }>
    }>
  }
}

export default function StudentNotesPage() {
  const [notes, setNotes] = React.useState<Note[]>([])
  const [enrolledCourses, setEnrolledCourses] = React.useState<
    EnrolledCourse[]
  >([])
  const [selectedNote, setSelectedNote] = React.useState<Note | undefined>()
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  // The fetch effect depends on the debounced value, so typing does not fire
  // a request per keystroke.
  const debouncedQuery = useDebounced(searchQuery, 300)
  const [courseFilter, setCourseFilter] = React.useState<string>("all")
  const [isNewNote, setIsNewNote] = React.useState(false)
  // A failed save must not silently close the note dialog.
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [newNoteLessonId, setNewNoteLessonId] = React.useState<string>("")

  React.useEffect(() => {
    async function loadInitial() {
      setIsLoading(true)
      try {
        const [notesRes, coursesRes] = await Promise.all([
          apiGet<{ notes: Note[] }>("/notes"),
          apiGet<EnrolledCourse[]>("/enrolments/my"),
        ])

        // Fixed: replaced raw fetch with apiGet
        if (notesRes.data) {
          setNotes(notesRes.data.notes || [])
        }

        if (coursesRes.data) {
          const enrolments = coursesRes.data
          // Load full course data with modules/lessons for the lesson picker
          const coursesWithData: EnrolledCourse[] = await Promise.all(
            (enrolments as EnrolledCourse[]).map(async (e: EnrolledCourse) => {
              try {
                const res = await apiGet<Record<string, unknown>>(
                  `/courses/${e.courseId}`
                )
                // GET /api/courses/[id] returns { course }, not a bare course.
                const payload = res.data as {
                  course?: EnrolledCourse["course"]
                } | null
                if (payload?.course?.modules?.length) {
                  return { courseId: e.courseId, course: payload.course }
                }
              } catch {}
              return { courseId: e.courseId, course: e.course }
            })
          )
          setEnrolledCourses(coursesWithData)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitial()
  }, [])

  React.useEffect(() => {
    if (isLoading) return
    async function loadNotes() {
      try {
        const params = new URLSearchParams()
        if (debouncedQuery) params.append("search", debouncedQuery)
        if (courseFilter !== "all") params.append("courseId", courseFilter)

        // Fixed: replaced raw fetch with apiGet
        const result = await apiGet<{ notes: Note[] }>(`/notes?${params}`)
        if (result.data) {
          setNotes(result.data.notes || [])
        }
      } catch (error) {
        console.error("Failed to load notes:", error)
      }
    }
    loadNotes()
  }, [debouncedQuery, courseFilter, isLoading])

  const handleSaveNote = async (content: string, timestamp?: number) => {
    try {
      const body: Record<string, unknown> = { content }
      if (timestamp !== undefined) body.timestamp = timestamp
      if (!selectedNote && newNoteLessonId) {
        body.lessonId = newNoteLessonId
      } else if (!selectedNote) {
        // Use first available lesson as fallback
        const firstCourse = enrolledCourses[0]
        const firstLesson = firstCourse?.course?.modules?.[0]?.lessons?.[0]
        if (firstLesson) {
          body.lessonId = String(firstLesson.id)
        } else {
          return // No lessons available
        }
      }

      // apiPost/apiPatch resolve `{ error }` and never throw, so a failed save fell
      // through both `if (result.data)` branches, skipped the catch, and still
      // ran setIsNewNote(false) — closing the dialog and discarding whatever the
      // student had typed, with no error and no list entry.
      const result = selectedNote
        ? await apiPatch<{ note: Note }>(`/notes/${selectedNote.id}`, body)
        : await apiPost<{ note: Note }>("/notes", body)

      if (result.error || !result.data) {
        setSaveError(result.error ?? "Failed to save note")
        return
      }

      setSaveError(null)
      if (selectedNote) {
        setNotes((prev) =>
          prev.map((n) => (n.id === selectedNote.id ? result.data!.note : n))
        )
      } else {
        setNotes((prev) => [result.data!.note, ...prev])
      }
      setSelectedNote(result.data.note)
      setIsNewNote(false)
    } catch (error) {
      console.error("Failed to save note:", error)
      setSaveError("Failed to save note")
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedNote) return

    try {
      // Fixed: replaced raw fetch with apiDelete
      const result = await apiDelete(`/notes/${selectedNote.id}`)
      if (!result.error) {
        setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id))
        setSelectedNote(undefined)
      }
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="My Notes"
          description="View and manage your lesson notes"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingCard count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="My Notes"
        description="View and manage your lesson notes"
        action={
          <Dialog open={isNewNote} onOpenChange={setIsNewNote}>
            <DialogTrigger asChild>
              <Button>New Note</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel>Select Lesson</FieldLabel>
                  <Select
                    value={newNoteLessonId}
                    onValueChange={setNewNoteLessonId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a lesson..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {enrolledCourses.map((e) =>
                          e.course?.modules?.map(
                            (mod: {
                              id: number
                              title: string
                              lessons: Array<{ id: number; title: string }>
                            }) =>
                              mod.lessons?.map(
                                (lesson: { id: number; title: string }) => (
                                  <SelectItem
                                    key={lesson.id}
                                    value={String(lesson.id)}
                                  >
                                    {e.course.title} &gt; {mod.title} &gt;{" "}
                                    {lesson.title}
                                  </SelectItem>
                                )
                              )
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              {saveError ? (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              ) : null}
              {newNoteLessonId && <NotesEditor onSave={handleSaveNote} />}
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupInput
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Courses</SelectItem>
              {enrolledCourses.map((e) => (
                <SelectItem key={e.courseId} value={String(e.courseId)}>
                  {e.course.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      {notes.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bookmark />
            </EmptyMedia>
            <EmptyTitle>No notes yet</EmptyTitle>
            <EmptyDescription>
              Take notes while watching lessons to remember important points.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setIsNewNote(true)}>
              Create Your First Note
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          {/* Notes List */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">My Notes</h2>
              <Badge variant="secondary">{notes.length}</Badge>
            </div>
            {notes.map((note) => (
              <Card
                key={note.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent",
                  selectedNote?.id === note.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedNote(note)}
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                    <h3 className="line-clamp-1 min-w-0 font-medium">
                      {note.lesson.title}
                    </h3>
                    <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                      {formatDistanceToNow(new Date(note.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {note.lesson.module.title}
                  </p>
                  <p className="line-clamp-2 text-sm">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Note Editor */}
          <div className="min-w-0 lg:col-span-2">
            {selectedNote ? (
              <NotesEditor
                note={selectedNote}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
              />
            ) : (
              <Empty className="rounded-lg border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bookmark />
                  </EmptyMedia>
                  <EmptyTitle>No note selected</EmptyTitle>
                  <EmptyDescription>
                    Select a note to view or edit
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
