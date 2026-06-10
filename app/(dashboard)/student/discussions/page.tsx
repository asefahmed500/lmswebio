/**
 * Student Discussions Page
 * View and participate in course discussions
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { DiscussionList } from "@/components/discussions/discussion-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingCard } from "@/components/loading-skeleton"
import { apiGet } from "@/lib/api-client"

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
  courseId: number
  course: {
    id: number
    title: string
  }
}

export default function StudentDiscussionsPage() {
  const [discussions, setDiscussions] = React.useState<Discussion[]>([])
  const [courses, setCourses] = React.useState<EnrolledCourse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCourse, setSelectedCourse] = React.useState<string>("all")

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
        if (searchQuery) params.append("search", searchQuery)
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
  }, [searchQuery, selectedCourse, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discussions</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Discussions</h1>
          <p className="mt-1 text-muted-foreground">
            Participate in course discussions
          </p>
        </div>
        <Button asChild>
          <Link href="/student/discussions">
            <Plus data-icon="inline-start" />
            New Discussion
          </Link>
        </Button>
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
