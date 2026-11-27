"use client"

import { useState } from "react"
import { ArrowRight, X, BookOpen, Play } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { SynexNavbar } from "@/components/synex/Navbar"

/** Neutral illustration labels — no invented metrics or learner names. */
const previewStats = ["Courses", "Hours", "Certificates", "Day streak"]
const previewCourses = ["Course 01", "Course 02", "Course 03"]
const previewNav = [
  "Dashboard",
  "Courses",
  "Progress",
  "Calendar",
  "Certificates",
  "Settings",
]

export function SynexHero() {
  const [bannerVisible, setBannerVisible] = useState(true)

  return (
    <section className="bg-background">
      {bannerVisible && (
        <div className="border-b border-border bg-background">
          <div className="relative mx-auto flex min-h-10 max-w-7xl items-center justify-center gap-3 px-5 py-2">
            <Badge variant="secondary">New</Badge>
            <span className="text-sm text-muted-foreground">
              Learning paths — ordered course sequences you can enrol in.
            </span>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/student/learning-paths">
                Learn more
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setBannerVisible(false)}
              className="absolute right-4"
              aria-label="Dismiss"
            >
              <X data-icon />
            </Button>
          </div>
        </div>
      )}

      <SynexNavbar />

      <div className="mx-auto max-w-7xl px-5 pt-20 sm:pt-24">
        <div className="text-center">
          <h1 className="mx-auto max-w-3xl text-[clamp(36px,7vw,64px)] leading-tight font-medium tracking-tight text-foreground">
            Great careers start with great courses.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Expert-led courses in technology, design, and business. Learn at
            your own pace, earn certificates, advance your career.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/register">
                Get started for free
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/courses">
                <Play data-icon="inline-start" />
                Browse courses
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mx-auto mt-14 max-w-6xl overflow-hidden py-0">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <span className="text-[9px] font-medium">L</span>
              </span>
              <span className="text-xs text-muted-foreground">LMSio</span>
            </div>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="size-2 rounded-full bg-muted-foreground/30" />
            </div>
          </div>

          <Separator />

          <div className="flex min-h-80">
            <div className="hidden w-44 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
              <div className="p-3">
                {previewNav.map((item, i) => (
                  <div
                    key={item}
                    className={`mb-0.5 rounded-md px-3 py-1.5 text-xs ${
                      i === 0
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 flex-1 p-4">
              <div className="mb-3 text-sm font-medium text-foreground">
                Welcome back
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {previewStats.map((label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border bg-background p-2.5"
                  >
                    <div className="text-lg font-medium text-foreground">—</div>
                    <div className="text-[10px] text-muted-foreground">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {previewCourses.map((title) => (
                  <div
                    key={title}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <BookOpen className="size-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-foreground">
                        {title}
                      </div>
                      <Progress value={0} className="mt-1 h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

export default SynexHero
