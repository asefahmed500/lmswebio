/**
 * Student Discussions Page
 * View and participate in course discussions
 */

"use client"

import * as React from "react"
import { CircleAlert, Plus, Search } from "lucide-react"
import { DiscussionList } from "@/features/community/discussion-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingCard } from "@/components/loading-skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { PageHeader } from "@/features/dashboard/components/page-header"
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
        if (debouncedQuery) params.append("search", debouncedQuery)
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
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Discussions"
          description="Participate in course discussions"
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
        title="Discussions"
        description="Participate in course discussions"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog} disabled={courses.length === 0}>
                <Plus data-icon="inline-start" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleCreate}>
                <FieldGroup>
                  <DialogHeader>
                    <DialogTitle>Start a discussion</DialogTitle>
                    <DialogDescription>
                      Post a question in one of your enrolled courses.
                    </DialogDescription>
                  </DialogHeader>

                  {createError ? (
                    <Alert variant="destructive">
                      <CircleAlert />
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
                      <Field>
                        <FieldLabel htmlFor="discussion-course">
                          Course
                        </FieldLabel>
                        <Select
                          value={draftCourseId}
                          onValueChange={setDraftCourseId}
                        >
                          <SelectTrigger id="discussion-course">
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {courses.map((c) => (
                                <SelectItem
                                  key={c.courseId}
                                  value={String(c.courseId)}
                                >
                                  {c.course.title}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="discussion-title">
                          Title
                        </FieldLabel>
                        <Input
                          id="discussion-title"
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          placeholder="What do you want to ask?"
                          required
                          maxLength={200}
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="discussion-content">
                          Details
                        </FieldLabel>
                        <Textarea
                          id="discussion-content"
                          value={draftContent}
                          onChange={(e) => setDraftContent(e.target.value)}
                          placeholder="Add context, what you have tried, and where you are stuck."
                          rows={5}
                          required
                        />
                      </Field>
                    </>
                  )}
                </FieldGroup>

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
        }
      />

      {/* Filters */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupInput
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((e) => (
                <SelectItem key={e.courseId} value={String(e.courseId)}>
                  {e.course.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Discussions */}
      <DiscussionList discussions={discussions} />
    </div>
  )
}
