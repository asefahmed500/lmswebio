"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen, Layers, Users, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function CourseCard({ course, enrolled = false }: CourseCardProps) {
  const isFree = !course.price || course.price === 0

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-graphite/10 bg-chalk transition-shadow hover:shadow-md">
      <Link
        href={`/courses/${course.slug}`}
        className="block overflow-hidden rounded-t-xl"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-canvas">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-graphite/20">
              <BookOpen className="size-10" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-visueltpro text-[10px] font-medium tracking-[0.04em] uppercase",
                isFree
                  ? "bg-void-black text-chalk"
                  : enrolled
                    ? "border border-graphite/15 bg-chalk text-graphite"
                    : "bg-void-black text-chalk"
              )}
            >
              {isFree
                ? "Free"
                : enrolled
                  ? "Enrolled"
                  : `$${course.price!.toFixed(0)}`}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center gap-2 font-visueltpro text-[10px] font-medium tracking-[0.06em] text-smoke uppercase">
          <span className="rounded-full bg-canvas px-2 py-0.5">
            {levelLabels[course.level]}
          </span>
          {course.category && (
            <span className="rounded-full bg-canvas px-2 py-0.5 text-smoke">
              {course.category}
            </span>
          )}
        </div>

        <Link href={`/courses/${course.slug}`}>
          <h3 className="font-visueltpro text-[15px] leading-snug font-medium text-void-black transition-colors group-hover:text-carbon">
            {course.title}
          </h3>
        </Link>

        {course.description && (
          <p className="line-clamp-2 font-visueltpro text-[13px] leading-relaxed font-light text-smoke">
            {course.description}
          </p>
        )}

        <p className="font-visueltpro text-xs font-light text-smoke">
          {course.instructor.fullName}
        </p>

        <div className="flex-1" />

        <div className="flex items-center justify-between border-t border-graphite/8 pt-3">
          <div className="flex items-center gap-3 font-visueltpro text-xs font-light text-smoke">
            {course._count?.modules !== undefined &&
              course._count.modules > 0 && (
                <span className="flex items-center gap-1">
                  <Layers className="size-3" />
                  {course._count.modules}
                </span>
              )}
            {course._count?.enrolments !== undefined &&
              course._count.enrolments > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {course._count.enrolments}
                </span>
              )}
          </div>
          <Link
            href={
              enrolled
                ? `/student/courses/${course.id}`
                : `/courses/${course.slug}`
            }
            className="rounded-full bg-void-black px-3 py-1 font-visueltpro text-[12px] font-medium text-chalk transition-opacity hover:opacity-80"
          >
            {enrolled ? "Continue" : "View"}{" "}
            <ArrowRight className="inline size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
