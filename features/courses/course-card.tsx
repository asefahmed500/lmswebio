"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen, Layers, Users, ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface CourseCardProps {
  course: {
    id: number | string
    title: string
    slug: string
    description?: string
    thumbnail?: string
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    category?: string
    price?: number | null
    instructor: { id: number | string; fullName: string; avatarUrl?: string }
    _count?: { modules?: number; enrolments?: number }
  }
  progress?: number
  enrolled?: boolean
  showProgress?: boolean
  variant?: "default" | "compact"
}

const levelLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
}

export function CourseCard({
  course,
  enrolled = false,
  progress,
  showProgress = false,
}: CourseCardProps) {
  const isFree = !course.price || course.price === 0
  const href = enrolled
    ? `/student/courses/${course.id}`
    : `/courses/${course.slug}`

  return (
    <Card className="group/card flex h-full min-w-0 flex-col py-0 transition-colors hover:border-primary/30">
      <Link href={href} className="block min-w-0 overflow-hidden rounded-t-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/40">
              <BookOpen className="size-10" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge
              variant={enrolled ? "success" : isFree ? "secondary" : "default"}
            >
              {enrolled
                ? "Enrolled"
                : isFree
                  ? "Free"
                  : `$${course.price!.toFixed(0)}`}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge variant="outline">{levelLabels[course.level]}</Badge>
          {course.category ? (
            <Badge variant="secondary" className="max-w-full truncate">
              {course.category}
            </Badge>
          ) : null}
        </div>

        <Link href={href} className="min-w-0">
          <h3 className="line-clamp-2 text-[15px] leading-snug font-medium text-foreground transition-colors group-hover/card:text-primary">
            {course.title}
          </h3>
        </Link>

        {course.description ? (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        ) : null}

        <p className="truncate text-xs text-muted-foreground">
          {course.instructor.fullName}
        </p>

        {(showProgress || enrolled) && progress !== undefined ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <Progress
              value={Math.min(100, Math.max(0, progress))}
              className="h-1.5"
            />
          </div>
        ) : null}

        <div className="min-h-4 flex-1" />

        <Separator />
        <div className="flex min-w-0 items-center justify-between gap-3 pt-3">
          <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
            {course._count?.modules !== undefined &&
            course._count.modules > 0 ? (
              <span className="flex shrink-0 items-center gap-1">
                <Layers className="size-3" />
                {course._count.modules}
              </span>
            ) : null}
            {course._count?.enrolments !== undefined &&
            course._count.enrolments > 0 ? (
              <span className="flex shrink-0 items-center gap-1">
                <Users className="size-3" />
                {course._count.enrolments}
              </span>
            ) : null}
          </div>
          <Button asChild size="sm" variant={enrolled ? "default" : "outline"}>
            <Link href={href}>
              {enrolled ? "Continue" : "View"}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
