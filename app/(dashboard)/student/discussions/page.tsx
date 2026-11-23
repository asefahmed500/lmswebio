/**
 * Student Discussions Page
 * View and participate in course discussions
 */

"use client"

import * as React from "react"
import { Plus, Search } from "lucide-react"
import { DiscussionList } from "@/features/community/discussion-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingCard } from "@/components/loading-skeleton"
import { useDebounced } from "@/hooks/use-media-query"
import { apiGet, apiPost } from "@/lib/api-client"

interface Discussion {
  id: number
  title: string
  content: string
  isPinned: boolean
  isResolved: boolean
  createdAt: string
  user: {
    id: number
    fullName: string
    avatarUrl: string | null
    role: string
  }
  course: {
    id: number
    title: string
    slug: string
  }
  _count: {
    comments: number
    votes: number
  }
  userVote: number
}

interface EnrolledCourse {
  // ObjectId string, not a number — every id in prisma/schema.prisma is
  // `String @db.ObjectId`.
  courseId: string
  course: {
    id: string
    title: string
  }
}

export default function StudentDiscussionsPage() {
  const [discussions, setDiscussions] = React.useState<Discussion[]>([])
  const [courses, setCourses] = React.useState<EnrolledCourse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  // The fetch effect depends on the debounced value, so typing does not fire
  // a request per keystroke.
  const debouncedQuery = useDebounced(searchQuery, 300)
  const [selectedCourse, setSelectedCourse] = React.useState<string>("all")

  // New-discussion form state.
  // This previously lived behind a link to /student/discussions/new, which was
  // never implemented, so the button 404'd. The API already supports
  // POST /api/discussions for enrolled courses, so the form lives here.
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [draftCourseId, setDraftCourseId] = React.useState("")
  const [draftTitle, setDraftTitle] = React.useState("")
  const [draftContent, setDraftContent] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const openDialog = () => {
    setCreateError(null)
    setDraftTitle("")
    setDraftContent("")
    setDraftCourseId(
      selectedCourse !== "all" ? selectedCourse : (courses[0]?.courseId ?? "")
    )
    setIsDialogOpen(true)
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draftCourseId || !draftTitle.trim() || !draftContent.trim()) return

    setIsCreating(true)
    setCreateError(null)
    try {
      const result = await apiPost<{ discussion: Discussion }>("/discussions", {
        courseId: draftCourseId,
        title: draftTitle.trim(),
        content: draftContent.trim(),
      })
      if (result.error) {
        setCreateError(result.error)
        return
      }
      if (result.data?.discussion) {
        setDiscussions((prev) => [result.data!.discussion, ...prev])
      }
      setIsDialogOpen(false)
    } finally {
      setIsCreating(false)
    }
  }

  React.useEffect(() => {
    async function loadInitial() {
      setIsLoading(true)
      try {
        const [discResult, coursesResult] = await Promise.all([
          apiGet<Record<string, Discussion[]>>("/discussions"),
          apiGet("/enrolments/my"),
        ])

        if (discResult.data) {
          setDiscussions(discResult.data.discussions || [])
        }

        if (coursesResult.data) {
          const data = coursesResult.data
          const enrolments = Array.isArray(data)
            ? data
            : (data as Record<string, unknown>).enrolments || []
          setCourses(enrolments as EnrolledCourse[])
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
    async function loadDiscussions() {
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append("search", debouncedQuery)
        if (selectedCourse !== "all") params.append("courseId", selectedCourse)

        const result = await apiGet<Record<string, Discussion[]>>(
          `/discussions?${params}`
        )
        if (result.data) {
          setDiscussions(result.data.discussions || [])
        }
      } catch (error) {
        console.error("Failed to load discussions:", error)
      }
    }

    if (!isLoading) {
      loadDiscussions()
    }
  }, [debouncedQuery, selectedCourse, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discussions</h1>
          <p className="mt-1 text-muted-foreground">
            Participate in course discussions
          </p>
        </div>
        <LoadingCard count={3} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discussions</h1>
          <p className="mt-1 text-muted-foreground">
            Participate in course discussions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog} disabled={courses.length === 0}>
              <Plus data-icon="inline-start" />
              New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Start a discussion</DialogTitle>
                <DialogDescription>
                  Post a question in one of your enrolled courses.
                </DialogDescription>
              </DialogHeader>

              {createError ? (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              ) : null}

              {courses.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Enrol in a course before starting a discussion.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="discussion-course">Course</Label>
                    <Select
                      value={draftCourseId}
                      onValueChange={setDraftCourseId}
                    >
                      <SelectTrigger id="discussion-course">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem
                            key={c.courseId}
                            value={String(c.courseId)}
                          >
                            {c.course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="discussion-title">Title</Label>
                    <Input
                      id="discussion-title"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="What do you want to ask?"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="discussion-content">Details</Label>
                    <Textarea
                      id="discussion-content"
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      placeholder="Add context, what you have tried, and where you are stuck."
                      rows={5}
                      required
                    />
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isCreating ||
                    courses.length === 0 ||
                    !draftTitle.trim() ||
                    !draftContent.trim()
                  }
                >
                  {isCreating ? "Posting…" : "Post discussion"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((e) => (
              <SelectItem key={e.courseId} value={String(e.courseId)}>
                {e.course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Discussions */}
      <DiscussionList discussions={discussions} />
    </div>
  )
}
