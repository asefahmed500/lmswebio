/**
 * Student Learning Paths Page
 * Browse and enroll in learning paths
 */

"use client"

import * as React from "react"
import { TrendingUp, BookOpen, Clock, Users } from "lucide-react"
import { LearningPathCard } from "@/features/gamification/learning-path-card"
import { Card, CardContent } from "@/components/ui/card"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { apiGet } from "@/lib/api-client"

interface LearningPath {
  id: number
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: string
  estimatedDuration: number
  isPublished: boolean
  courses: {
    id: number
    course: {
      id: number
      title: string
      slug: string
      thumbnail: string | null
      level: string
      instructor: {
        id: number
        fullName: string
      }
    }
    order: number
    isMandatory: boolean
  }[]
  _count: {
    courses: number
    enrollments: number
  }
}

export default function StudentLearningPathsPage() {
  const [learningPaths, setLearningPaths] = React.useState<LearningPath[]>([])
  const [enrolledPaths, setEnrolledPaths] = React.useState<Set<number>>(
    new Set()
  )
  const [pathProgress, setPathProgress] = React.useState<Map<number, number>>(
    new Map()
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<"all" | "my">("all")
  const [levelFilter, setLevelFilter] = React.useState<string>("all")

  React.useEffect(() => {
    async function loadLearningPaths() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.append("myPaths", filter === "my" ? "true" : "false")
        if (levelFilter !== "all") params.append("level", levelFilter)

        const result = await apiGet<Record<string, LearningPath[]>>(
          `/learning-paths?${params}`
        )
        if (result.data) {
          setLearningPaths(result.data.learningPaths)

          const enrolledIds = new Set<number>()
          const progressMap = new Map<number, number>()

          await Promise.all(
            result.data.learningPaths.map(async (path: LearningPath) => {
              const enrollResult = await apiGet<Record<string, unknown>>(
                `/learning-paths/${path.id}/enroll`
              )
              if (
                enrollResult.data &&
                (enrollResult.data as Record<string, unknown>).enrolled
              ) {
                enrolledIds.add(path.id)
                progressMap.set(
                  path.id,
                  ((
                    (enrollResult.data as Record<string, unknown>)
                      .enrollment as Record<string, unknown>
                  )?.progress as number) || 0
                )
              }
            })
          )

          setEnrolledPaths(enrolledIds)
          setPathProgress(progressMap)
        }
      } catch (error) {
        console.error("Failed to load learning paths:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLearningPaths()
  }, [filter, levelFilter])

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Learning Paths"
          description="Structured course sequences for your learning journey"
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
        title="Learning Paths"
        description="Structured course sequences for your learning journey"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-md bg-primary/10 p-2">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{learningPaths.length}</p>
              <p className="text-sm text-muted-foreground">Total Paths</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-md bg-success/10 p-2">
              <BookOpen className="size-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{enrolledPaths.size}</p>
              <p className="text-sm text-muted-foreground">Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-md bg-info/10 p-2">
              <Clock className="size-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {learningPaths.reduce((sum, p) => sum + p.estimatedDuration, 0)}
                h
              </p>
              <p className="text-sm text-muted-foreground">Total Content</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-md bg-primary/10 p-2">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {learningPaths.reduce(
                  (sum, p) => sum + p._count.enrollments,
                  0
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total Learners</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
        <Select
          value={filter}
          onValueChange={(v: "all" | "my") => setFilter(v)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Paths</SelectItem>
              <SelectItem value="my">My Paths</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Learning Paths */}
      {learningPaths.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUp />
            </EmptyMedia>
            <EmptyTitle>No learning paths found</EmptyTitle>
            <EmptyDescription>
              {filter === "my"
                ? "You haven't enrolled in any learning paths yet."
                : "No learning paths available."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => (
            <LearningPathCard
              key={path.id}
              path={path}
              userProgress={pathProgress.get(path.id)}
              isEnrolled={enrolledPaths.has(path.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
