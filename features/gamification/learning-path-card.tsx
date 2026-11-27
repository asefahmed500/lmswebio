"use client"

import Link from "next/link"
import { Clock, BookOpen, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { ComponentProps } from "react"

/** Level labels carry a quiet status colour, never a bespoke tint. */
const levelVariants: Record<string, ComponentProps<typeof Badge>["variant"]> = {
  BEGINNER: "success",
  INTERMEDIATE: "info",
  ADVANCED: "warning",
}

interface LearningPath {
  id: number
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: string
  estimatedDuration: number
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

interface LearningPathCardProps {
  path: LearningPath
  userProgress?: number
  isEnrolled?: boolean
}

export function LearningPathCard({
  path,
  userProgress = 0,
  isEnrolled = false,
}: LearningPathCardProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-muted">
        {path.thumbnail ? (
          <img
            src={path.thumbnail}
            alt={path.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <TrendingUp className="size-12 text-muted-foreground" />
          </div>
        )}
        <Badge
          className="absolute top-2 right-2"
          variant={levelVariants[path.level] ?? "outline"}
        >
          {path.level}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">{path.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {path.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="size-4" />
            <span>{path._count.courses} courses</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{path.estimatedDuration}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>{path._count.enrollments}</span>
          </div>
        </div>

        {/* Course Progress */}
        {isEnrolled && userProgress > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Progress</span>
              <span className="font-medium">{userProgress}%</span>
            </div>
            <Progress value={userProgress} className="h-2" />
          </div>
        )}

        {/* Courses Preview */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Courses in this path:
          </p>
          <div className="flex flex-col gap-1">
            {path.courses.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded bg-muted/50 p-2 text-sm"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {item.order}
                </span>
                <span className="flex-1 truncate">{item.course.title}</span>
                {!item.isMandatory && (
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
            ))}
            {path._count.courses > 3 && (
              <p className="pl-9 text-xs text-muted-foreground">
                +{path._count.courses - 3} more courses
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/student/learning-paths">
            {isEnrolled ? "Continue Learning" : "View Path"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
