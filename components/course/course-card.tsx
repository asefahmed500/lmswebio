"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, BookOpen, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: {
    id: number
    title: string
    slug: string
    description?: string
    thumbnail?: string
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    category?: string
    tags?: string[]
    instructor: {
      id: number
      fullName: string
      avatarUrl?: string
    }
    duration?: number
    _count?: {
      modules?: number
      enrolments?: number
    }
  }
  progress?: number
  enrolled?: boolean
  showProgress?: boolean
  variant?: "default" | "compact"
}

/**
 * Course card component
 * Fully responsive with mobile-optimized layout and touch targets
 */
export function CourseCard({
  course,
  progress = 0,
  enrolled = false,
  showProgress = false,
  variant = "default",
}: CourseCardProps) {
  const levelColors = {
    BEGINNER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    INTERMEDIATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    ADVANCED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }

  // Get instructor initials
  const instructorInitials = course.instructor.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      className={cn(
        "group hover:shadow-lg transition-all duration-300 overflow-hidden",
        "focus-within:ring-2 focus-within:ring-ring",
        variant === "compact" && "max-w-sm"
      )}
    >
      {/* Course thumbnail/image */}
      <Link
        href={`/courses/${course.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-lg"
        aria-label={`View ${course.title}`}
      >
        <div className="aspect-video w-full bg-gradient-to-br from-purple-500 to-pink-500 relative overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={`${course.title} course thumbnail`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl md:text-5xl font-bold"
              aria-hidden="true"
            >
              {course.title.substring(0, 2).toUpperCase()}
            </div>
          )}
          {/* Progress overlay */}
          {showProgress && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 sm:p-3">
              <div className="flex items-center justify-between text-white text-xs sm:text-sm mb-1">
                <span>Progress</span>
                <span aria-label={`${Math.round(progress)} percent complete`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-1.5 sm:h-2" aria-label="Course progress" />
            </div>
          )}
          {/* Enrolled badge */}
          {enrolled && !showProgress && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-600 text-white text-xs" aria-label="You are enrolled in this course">
                Enrolled
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Course info */}
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/courses/${course.slug}`}>
              <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                {course.title}
              </CardTitle>
            </Link>
            <CardDescription className="line-clamp-2 mt-1 text-sm">
              {course.description}
            </CardDescription>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge
            className={cn(levelColors[course.level], "text-xs")}
            variant="secondary"
          >
            {course.level.toLowerCase()}
          </Badge>
          {course.category && (
            <Badge variant="outline" className="text-xs">
              {course.category}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Course stats */}
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="space-y-2 sm:space-y-3">
          {/* Instructor */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="w-6 h-6 sm:w-7 sm:h-7">
              <AvatarImage src={course.instructor.avatarUrl || undefined} alt={course.instructor.fullName} />
              <AvatarFallback aria-hidden="true">{instructorInitials}</AvatarFallback>
            </Avatar>
            <span className="truncate">{course.instructor.fullName}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            {course._count?.modules && (
              <div className="flex items-center gap-1" aria-label={`${course._count.modules} modules`}>
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span>{course._count.modules} modules</span>
              </div>
            )}
            {course._count?.enrolments && (
              <div className="flex items-center gap-1" aria-label={`${course._count.enrolments} students enrolled`}>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span>{course._count.enrolments} students</span>
              </div>
            )}
            {course.duration && (
              <div className="flex items-center gap-1" aria-label={`${course.duration} hours duration`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span>{course.duration}h</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Action button */}
      <CardFooter className="p-3 sm:p-6 pt-0">
        <Link
          href={enrolled ? `/courses/${course.slug}/learn` : `/courses/${course.slug}`}
          className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <button
            className={cn(
              "w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-md",
              "hover:bg-primary/90 transition-colors font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              // Larger touch target on mobile
              "min-h-[44px] sm:min-h-0"
            )}
          >
            {enrolled ? "Continue Learning" : "View Course"}
          </button>
        </Link>
      </CardFooter>
    </Card>
  )
}
