/**
 * Student Learning Paths Page
 * Browse and enroll in learning paths
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { TrendingUp, BookOpen, Clock, Users } from "lucide-react"
import { LearningPathCard } from "@/components/learning-paths/learning-path-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingCard } from "@/components/loading-skeleton"
import { apiGet, apiPost } from "@/lib/api-client"

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

  const handleEnroll = async (pathId: number) => {
    try {
      const result = await apiPost(`/learning-paths/${pathId}/enroll`)

      if (result.data) {
        setEnrolledPaths((prev) => new Set([...prev, pathId]))
        setPathProgress((prev) => new Map([...prev, [pathId, 0]]))
      }
    } catch (error) {
      console.error("Failed to enroll:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
          <p className="mt-1 text-muted-foreground">
            Structured course sequences for your learning journey
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
          <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
          <p className="mt-1 text-muted-foreground">
            Structured course sequences for your learning journey
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{learningPaths.length}</p>
              <p className="text-sm text-muted-foreground">Total Paths</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-success/10 rounded-full p-3">
              <BookOpen className="text-success size-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{enrolledPaths.size}</p>
              <p className="text-sm text-muted-foreground">Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-info/10 rounded-full p-3">
              <Clock className="text-info size-5" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {learningPaths.reduce((sum, p) => sum + p.estimatedDuration, 0)}
                h
              </p>
              <p className="text-sm text-muted-foreground">Total Content</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">
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
      <div className="flex gap-4">
        <Select
          value={filter}
          onValueChange={(v: "all" | "my") => setFilter(v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Paths</SelectItem>
            <SelectItem value="my">My Paths</SelectItem>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="BEGINNER">Beginner</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
            <SelectItem value="ADVANCED">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Learning Paths */}
      {learningPaths.length === 0 ? (
        <div className="py-12 text-center">
          <TrendingUp className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            No learning paths found
          </h3>
          <p className="text-muted-foreground">
            {filter === "my"
              ? "You haven't enrolled in any learning paths yet."
              : "No learning paths available."}
          </p>
        </div>
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
