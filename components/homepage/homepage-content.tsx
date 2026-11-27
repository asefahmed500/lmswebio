"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Shield,
  Clock,
  GraduationCap,
  BarChart3,
  Award,
  CheckCircle2,
  Users,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseCard } from "@/features/courses/course-card"
import type { HomepageStats } from "@/types/homepage"
import { cn } from "@/lib/utils"

interface ApiCourse {
  id: number
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  category: string | null
  price: number | null
  instructor: { id: number; fullName: string; avatarUrl: string | null }
  _count: { modules: number; enrolments: number }
}

/** A quiet, real stat: no entrance animation, no motion values. */
function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[40px] leading-none font-medium tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

/**
 * Seeded demo accounts (prisma/seed.ts).
 *
 * This replaces a set of invented testimonials. The previous version attributed
 * quotes and metrics ("500+ employees", "onboarding dropped 40%") to named
 * people at companies that do not exist, which is fabricated endorsement and
 * cannot ship. Pointing a visitor at real, working credentials is both honest
 * and more useful.
 */
const demoAccounts = [
  {
    role: "Student",
    email: "student@lms.com",
    password: "Student123!",
    blurb:
      "Browse the catalogue, enrol in a course, take a quiz and submit an assignment.",
  },
  {
    role: "Instructor",
    email: "instructor@lms.com",
    password: "Instructor123!",
    blurb:
      "Create a course, publish it, add modules and lessons, and grade submissions.",
  },
  {
    role: "Admin",
    email: "admin@lms.com",
    password: "Admin123!",
    blurb:
      "Approve courses, manage users and roles, and read platform analytics.",
  },
]

/**
 * Platform capabilities, all of which are implemented.
 *
 * The previous list advertised white-label branding, custom domains, SSO,
 * "SOC 2 compliance" and a dedicated account manager. None of those exist in
 * this codebase — each string appeared exactly once, here, and nowhere else.
 * Every entry below maps to a feature that is actually built.
 */
const platformCapabilities = [
  {
    icon: BookOpen,
    title: "Course catalogue",
    desc: "Publish priced or free courses with modules, lessons, tags and categories.",
  },
  {
    icon: Users,
    title: "Role-based access",
    desc: "Separate student, instructor and admin workspaces, enforced in middleware.",
  },
  {
    icon: ClipboardCheck,
    title: "Quizzes and grading",
    desc: "Timed quizzes with auto-scoring, plus assignments with a manual grading queue.",
  },
  {
    icon: Award,
    title: "Certificates",
    desc: "Issued on course completion, each with a publicly verifiable ID.",
  },
  {
    icon: BarChart3,
    title: "Progress analytics",
    desc: "Per-course completion, aggregate progress, and platform-level enrolment trends.",
  },
  {
    icon: MessageCircle,
    title: "Course community",
    desc: "Threaded discussions with nested replies and up or down voting.",
  },
]

/**
 * The real commerce model.
 *
 * Courses are priced individually by the instructor. Checkout creates a
 * one-time Stripe payment (`mode: "payment"`) per course — there is no
 * subscription, no seat-based tier and no trial anywhere in the codebase. The
 * previous table advertised a $29/month "Pro" subscription, a free trial, a
 * "Contact sales" enterprise plan and offline downloads, none of which exist.
 */
const pricingTiers = [
  {
    name: "Free courses",
    price: "Free",
    desc: "Any course an instructor publishes with no price set.",
    features: [
      "Full enrolment and progress tracking",
      "Quizzes with auto-scoring",
      "Assignments and feedback",
      "Verifiable certificate on completion",
    ],
    cta: "Browse free courses",
    href: "/courses",
    featured: false,
  },
  {
    name: "Paid courses",
    price: "One-time",
    desc: "A single payment per course, set by the instructor.",
    features: [
      "Everything in free courses",
      "One-time Stripe checkout",
      "Enrolment on confirmed payment",
      "Payment history in your account",
    ],
    cta: "Browse the catalogue",
    href: "/courses",
    featured: true,
  },
  {
    name: "Sell your own",
    price: "Set by you",
    desc: "Instructor accounts can create and publish courses.",
    features: [
      "Create courses, modules and lessons",
      "Set your own price per course",
      "Grade submissions and review attempts",
      "Per-course completion analytics",
    ],
    cta: "Create an account",
    href: "/register",
    featured: false,
  },
]

const categories = [
  "Technology",
  "Design",
  "Business",
  "Science",
  "Arts",
  "Health",
  "Marketing",
  "Data Science",
]

const features = [
  {
    icon: GraduationCap,
    title: "Instructor profiles",
    desc: "Instructors publish courses with bio, expertise and aggregated learner reviews.",
  },
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    desc: "Carefully designed module-by-module paths that build skills progressively.",
  },
  {
    icon: Clock,
    title: "Self-Paced Learning",
    desc: "Work through modules and lessons at your own pace, with progress saved as you go.",
  },
  {
    icon: Shield,
    title: "Verified Certificates",
    desc: "Completing a course issues a certificate with a public verification ID.",
  },
]

export function HomepageContent() {
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [stats, setStats] = useState<HomepageStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalInstructors: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/courses/public?limit=8")
        if (res.ok) {
          const data = await res.json()
          setCourses(data.courses || [])
          if (data.stats) setStats(data.stats)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex flex-col bg-background">
      <Separator />

      {/* STATS */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid grid-cols-2 gap-10 sm:gap-12 lg:grid-cols-3">
            <Stat value={stats.totalStudents} label="Students" />
            <Stat value={stats.totalCourses} label="Courses" />
            <Stat value={stats.totalInstructors} label="Instructors" />
          </div>
        </div>
      </section>

      <Separator />

      {/* TOP COURSES */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="mb-3 text-[34px] leading-tight font-medium tracking-tight text-foreground sm:text-[40px]">
            Top Courses
          </h2>
          <p className="mb-10 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Our most sought-after courses, curated for maximum impact.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {courses.slice(0, 8).map((course) => (
                <CourseCard
                  key={course.id}
                  course={{
                    id: course.id,
                    title: course.title,
                    slug: course.slug,
                    description: course.description || undefined,
                    thumbnail: course.thumbnail || undefined,
                    level: course.level,
                    category: course.category || undefined,
                    price: course.price,
                    instructor: course.instructor
                      ? {
                          id: course.instructor.id,
                          fullName: course.instructor.fullName,
                          avatarUrl: course.instructor.avatarUrl ?? undefined,
                        }
                      : { id: 0, fullName: "Instructor", avatarUrl: undefined },
                    _count: {
                      modules: course._count.modules || 0,
                      enrolments: course._count.enrolments || 0,
                    },
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/courses">
                View all courses
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* CATEGORIES */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <h2 className="mb-3 text-[34px] leading-tight font-medium tracking-tight text-foreground sm:text-[40px]">
            Browse by category
          </h2>
          <p className="mx-auto mb-10 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Find exactly what you need across every discipline.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 font-normal"
              >
                <Link href={`/courses?category=${cat.toLowerCase()}`}>
                  {cat}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* FEATURES */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="mb-10 text-center text-[34px] leading-tight font-medium tracking-tight text-foreground sm:text-[40px]">
            Why LMSio
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {features.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="py-0">
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-1.5 text-[18px] font-medium tracking-tight text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* TRY IT — real seeded accounts, replacing invented testimonials */}
      <section id="try-it" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-[34px] leading-tight font-medium tracking-tight text-foreground sm:text-[40px]">
              Log in and try it
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              The seed script creates one account per role. Sign in as any of
              them to see the workspace that role actually gets.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {demoAccounts.map((account) => (
              <Card key={account.role} className="py-0">
                <CardContent className="flex h-full flex-col p-6">
                  <Badge variant="secondary" className="mb-4 w-fit">
                    {account.role}
                  </Badge>
                  <dl className="mb-4 flex flex-col gap-1 font-mono text-[13px]">
                    <div className="flex items-baseline gap-2">
                      <dt className="w-14 shrink-0 text-muted-foreground">
                        email
                      </dt>
                      <dd className="min-w-0 truncate text-foreground select-all">
                        {account.email}
                      </dd>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <dt className="w-14 shrink-0 text-muted-foreground">
                        password
                      </dt>
                      <dd className="min-w-0 truncate text-foreground select-all">
                        {account.password}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                    {account.blurb}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild>
              <Link href="/login">
                Go to sign in
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* WHAT'S BUILT */}
      <section id="enterprise" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <Badge variant="outline" className="mb-4">
            Built in
          </Badge>
          <h2 className="text-[34px] leading-tight font-medium tracking-tight text-foreground sm:text-[40px]">
            What you actually get
          </h2>
          <p className="mt-3 mb-10 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Every feature below is implemented in this codebase and reachable
            from the three demo accounts.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {platformCapabilities.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="py-0">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-4 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="mb-1.5 text-base font-medium tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="mt-10">
            <Button asChild>
              <Link href="/register">
                Create an account
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* PRICING */}
      <section id="pricing-info" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 text-center">
            <h2 className="text-[34px] leading-tight font-medium tracking-tight text-foreground sm:text-[40px]">
              Course pricing
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Free or paid, per course. Instructors set the price; there is no
              subscription.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={cn("h-full py-0", tier.featured && "border-primary")}
              >
                <CardContent className="flex h-full flex-col p-6">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    {tier.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-[36px] leading-none font-medium tracking-tight text-foreground">
                      {tier.price}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tier.desc}
                  </p>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-success"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 font-normal">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={tier.featured ? "default" : "outline"}
                    className="mt-auto w-full"
                  >
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <h2 className="text-[34px] leading-tight font-medium tracking-tight text-foreground sm:text-[40px]">
            Ready to start learning?
          </h2>
          <p className="mx-auto mt-3 mb-8 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            {stats.totalCourses > 0
              ? `${stats.totalCourses} courses, taught and tracked end to end.`
              : "Create an account and start publishing or learning."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/register">
                Create free account
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
