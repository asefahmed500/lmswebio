"use client"

import "@blossom-carousel/core/style.css"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { BlossomCarousel } from "@blossom-carousel/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CoursePreview } from "@/types/homepage"
import { cn } from "@/lib/utils"

const levelLabels: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
}

function formatPrice(price: number | null | undefined): string {
  if (!price || price === 0) return "Free"
  return `$${price.toFixed(2)}`
}

export function CourseCarousel({ courses }: { courses: CoursePreview[] }) {
  const ref = useRef<HTMLElement | null>(null)

  return (
    <div className="group/carousel relative">
      <BlossomCarousel
        ref={ref}
        as="ul"
        className="flex snap-x snap-mandatory scrollbar-none gap-5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {courses.map((course) => {
          const isFree = !course.price || course.price === 0

          return (
            <li
              key={course.id}
              className="w-[280px] shrink-0 snap-start sm:w-[300px]"
            >
              {/* Flat product card — no shadow, no radius */}
              <div className="group">
                <Link href={`/courses/${course.id}`} className="block">
                  <div className="aspect-square w-full overflow-hidden bg-[var(--color-soft-cloud)]">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[var(--color-mute)] uppercase">
                        {course.title.substring(0, 2)}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[var(--color-mute)]">
                      {levelLabels[course.level]}
                    </span>
                    {course.category && (
                      <>
                        <span className="text-[var(--color-hairline)]">·</span>
                        <span className="text-[14px] font-medium text-[var(--color-mute)]">
                          {course.category}
                        </span>
                      </>
                    )}
                  </div>

                  <Link href={`/courses/${course.id}`}>
                    <h3 className="line-clamp-2 text-[16px] leading-tight font-medium text-[var(--color-ink)] group-hover:opacity-70">
                      {course.title}
                    </h3>
                  </Link>

                  {course.description && (
                    <p className="line-clamp-1 text-[14px] text-[var(--color-mute)]">
                      {course.description}
                    </p>
                  )}

                  <p className="text-[14px] text-[var(--color-mute)]">
                    {course.instructor}
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[14px] text-[var(--color-mute)]">
                      {course.moduleCount !== undefined && (
                        <span>{course.moduleCount} modules</span>
                      )}
                      {course.studentCount !== undefined && (
                        <span>{course.studentCount} students</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[16px] font-medium",
                        isFree
                          ? "text-[var(--color-mute)]"
                          : "text-[var(--color-sale)]"
                      )}
                    >
                      {formatPrice(course.price)}
                    </span>
                  </div>

                  <Link href={`/courses/${course.id}`} className="mt-1">
                    <Button className="nike-pill-sm w-full bg-[var(--color-ink)] text-[var(--color-canvas)] hover:bg-[var(--color-charcoal)]">
                      {isFree ? "Enrol" : "Buy"}
                    </Button>
                  </Link>
                </div>
              </div>
            </li>
          )
        })}
      </BlossomCarousel>

      <button
        onClick={() =>
          ref.current?.scrollBy({ left: -320, behavior: "smooth" })
        }
        className="absolute top-1/3 left-2 z-10 flex size-10 items-center justify-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] opacity-0 transition-opacity group-hover/carousel:opacity-100"
        aria-label="Previous"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => ref.current?.scrollBy({ left: 320, behavior: "smooth" })}
        className="absolute top-1/3 right-2 z-10 flex size-10 items-center justify-center rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] opacity-0 transition-opacity group-hover/carousel:opacity-100"
        aria-label="Next"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
