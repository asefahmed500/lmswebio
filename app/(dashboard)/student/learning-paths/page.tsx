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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingCard } from "@/components/loading-skeleton"

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
  const [enrolledPaths, setEnrolledPaths] = React.useState<Set<number>>(new Set())
  const [pathProgress, setPathProgress] = React.useState<Map<number, number>>(new Map())
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

        const response = await fetch(`/api/learning-paths?${params}`)
        if (response.ok) {
          const data = await response.json()
          setLearningPaths(data.learningPaths)

          // Get enrolled paths and progress
          const enrolledIds = new Set<number>()
          const progressMap = new Map<number, number>()

          await Promise.all(
            data.learningPaths.map(async (path: LearningPath) => {
              const enrollResponse = await fetch(`/api/learning-paths/${path.id}/enroll`)
              if (enrollResponse.ok) {
                const enrollData = await enrollResponse.json()
                if (enrollData.enrolled) {
                  enrolledIds.add(path.id)
                  progressMap.set(path.id, enrollData.enrollment?.progress || 0)
                }
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
      const response = await fetch(`/api/learning-paths/${pathId}/enroll`, {
        method: "POST",
      })

      if (response.ok) {
        setEnrolledPaths((prev) => new Set([...prev, pathId]))
        setPathProgress((prev) => new Map([...prev, [pathId, 0]]))
      }
    } catch (error) {
      console.error("Failed to enroll:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
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
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="p-3 bg-primary/10 rounded-full">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">{learningPaths.length}</p>
            <p className="text-sm text-muted-foreground">Total Paths</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="p-3 bg-green-500/10 rounded-full">
            <BookOpen className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold">{enrolledPaths.size}</p>
            <p className="text-sm text-muted-foreground">Enrolled</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold">
              {learningPaths.reduce((sum, p) => sum + p.estimatedDuration, 0)}h
            </p>
            <p className="text-sm text-muted-foreground">Total Content</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="p-3 bg-purple-500/10 rounded-full">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xl font-bold">
              {learningPaths.reduce((sum, p) => sum + p._count.enrollments, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Learners</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filter} onValueChange={(v: "all" | "my") => setFilter(v)}>
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
        <div className="text-center py-12">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No learning paths found</h3>
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
