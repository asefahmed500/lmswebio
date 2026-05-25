/**
 * Student Notes Page
 * View and manage lesson notes
 */

"use client"

import * as React from "react"
import { Bookmark, Search } from "lucide-react"
import { NotesEditor } from "@/components/notes/notes-editor"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
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
import { Label } from "@/components/ui/label"
import { formatDistanceToNow } from "date-fns"
import { LoadingCard } from "@/components/loading-skeleton"

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
  const [enrolledCourses, setEnrolledCourses] = React.useState<EnrolledCourse[]>([])
  const [selectedNote, setSelectedNote] = React.useState<Note | undefined>()
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState<string>("all")
  const [isNewNote, setIsNewNote] = React.useState(false)
  const [newNoteLessonId, setNewNoteLessonId] = React.useState<string>("")

  React.useEffect(() => {
    async function loadInitial() {
      setIsLoading(true)
      try {
        const [notesRes, coursesRes] = await Promise.all([
          fetch("/api/notes"),
          fetch("/api/enrolments/my"),
        ])

        if (notesRes.ok) {
          const data = await notesRes.json()
          setNotes(data.notes || [])
        }

        if (coursesRes.ok) {
          const data = await coursesRes.json()
          const enrolments = Array.isArray(data) ? data : data.enrolments || []
          // Load full course data with modules/lessons for the lesson picker
          const coursesWithData = await Promise.all(
            enrolments.map(async (e: any) => {
              try {
                const res = await fetch(`/api/courses/${e.courseId}`)
                if (res.ok) return { courseId: e.courseId, course: await res.json() }
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
        if (searchQuery) params.append("search", searchQuery)
        if (courseFilter !== "all") params.append("courseId", courseFilter)

        const response = await fetch(`/api/notes?${params}`)
        if (response.ok) {
          const data = await response.json()
          setNotes(data.notes || [])
        }
      } catch (error) {
        console.error("Failed to load notes:", error)
      }
    }
    loadNotes()
  }, [searchQuery, courseFilter, isLoading])

  const handleSaveNote = async (content: string, timestamp?: number) => {
    try {
      const url = selectedNote
        ? `/api/notes/${selectedNote.id}`
        : "/api/notes"
      const method = selectedNote ? "PATCH" : "POST"

      const body: any = { content }
      if (timestamp !== undefined) body.timestamp = timestamp
      if (!selectedNote && newNoteLessonId) {
        body.lessonId = parseInt(newNoteLessonId)
      } else if (!selectedNote) {
        // Use first available lesson as fallback
        const firstCourse = enrolledCourses[0]
        const firstLesson = firstCourse?.course?.modules?.[0]?.lessons?.[0]
        if (firstLesson) {
          body.lessonId = firstLesson.id
        } else {
          return // No lessons available
        }
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        if (selectedNote) {
          setNotes((prev) =>
            prev.map((n) => (n.id === selectedNote.id ? data.note : n))
          )
          setSelectedNote(data.note)
        } else {
          setNotes((prev) => [data.note, ...prev])
          setSelectedNote(data.note)
        }
        setIsNewNote(false)
      }
    } catch (error) {
      console.error("Failed to save note:", error)
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedNote) return

    try {
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id))
        setSelectedNote(undefined)
      }
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  // Get unique courses from notes for the filter
  const coursesFromNotes = React.useMemo(() => {
    const courseMap = new Map<number, string>()
    notes.forEach((note) => {
      if (note.lesson?.module?.courseId) {
        courseMap.set(note.lesson.module.courseId, note.lesson.module.title)
      }
    })
    return Array.from(courseMap.entries()).map(([id, title]) => ({ id, title }))
  }, [notes])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your lesson notes
          </p>
        </div>
        <LoadingCard />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your lesson notes
          </p>
        </div>
        <Dialog open={isNewNote} onOpenChange={setIsNewNote}>
          <DialogTrigger asChild>
            <Button>New Note</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            {/* Lesson picker */}
            <div className="space-y-2">
              <Label>Select Lesson</Label>
              <Select value={newNoteLessonId} onValueChange={setNewNoteLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lesson..." />
                </SelectTrigger>
                <SelectContent>
                  {enrolledCourses.map((e) =>
                    e.course?.modules?.map((mod: any) =>
                      mod.lessons?.map((lesson: any) => (
                        <SelectItem key={lesson.id} value={String(lesson.id)}>
                          {e.course.title} &gt; {mod.title} &gt; {lesson.title}
                        </SelectItem>
                      ))
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            {newNoteLessonId && (
              <NotesEditor onSave={handleSaveNote} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {enrolledCourses.map((e) => (
              <SelectItem key={e.courseId} value={String(e.courseId)}>
                {e.course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">
                Take notes while watching lessons to remember important points.
              </p>
              <Button onClick={() => setIsNewNote(true)}>Create Your First Note</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Notes List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-lg">{notes.length} Notes</h2>
            {notes.map((note) => (
              <Card
                key={note.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedNote?.id === note.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium line-clamp-1">
                      {note.lesson.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(note.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {note.lesson.module.title}
                  </p>
                  <p className="text-sm line-clamp-2">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Note Editor */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <NotesEditor
                note={selectedNote}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Bookmark className="mx-auto mb-4 h-12 w-12" />
                    <p>Select a note to view or edit</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
