"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Shield,
  Clock,
  GraduationCap,
  Star,
  Building2,
  BarChart3,
  Globe,
  Headphones,
  Lock,
  Award,
  CheckCircle2,
  Play,
  LayoutDashboard,
  Calendar,
  Settings,
  TrendingUp,
  Circle,
} from "lucide-react"
import {
  motion,
  useInView,
  animate,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { CourseCard } from "@/components/course/course-card"
import type { HomepageStats } from "@/types/homepage"

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

function AnimatedCounter({
  value,
  label,
}: {
  value: number | string
  label: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  useEffect(() => {
    if (isInView && typeof value === "number")
      animate(motionValue, value, { duration: 2, ease: "easeOut" })
  }, [isInView, value, motionValue])
  return (
    <div ref={ref} className="text-center">
      <div className="font-bradford text-[40px] font-medium tracking-[-0.02em] text-void-black">
        {typeof value === "number" ? (
          <motion.span>{rounded}</motion.span>
        ) : (
          value
        )}
      </div>
      <div className="mt-1 font-visueltpro text-xs font-light tracking-[0.06em] text-smoke uppercase">
        {label}
      </div>
    </div>
  )
}

const testimonials = [
  {
    quote:
      "LMSio transformed how our team upskills. The structured paths and certificates gave us a clear way to measure growth.",
    name: "Sarah Chen",
    role: "VP of Engineering, TechForward",
  },
  {
    quote:
      "I went from junior developer to team lead in 8 months. The instructors are world-class and the curriculum is laser-focused.",
    name: "Marcus Johnson",
    role: "Engineering Lead, DataSphere",
  },
  {
    quote:
      "We rolled out LMSio to 500+ employees. Onboarding time dropped 40% and satisfaction scores hit an all-time high.",
    name: "Priya Patel",
    role: "CLO, GlobalEdge Corp.",
  },
]

const enterpriseFeatures = [
  {
    icon: Building2,
    title: "Team Management",
    desc: "Assign courses, track team progress, and manage licenses from a single dashboard.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    desc: "Real-time reporting on completion rates, skill gaps, and ROI per department.",
  },
  {
    icon: Globe,
    title: "Custom Branding",
    desc: "White-label the platform with your company logo, colors, and custom domain.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    desc: "Priority 24/7 support with a dedicated account manager for your organization.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "SSO integration, SOC 2 compliance, and role-based access control built in.",
  },
  {
    icon: Award,
    title: "Custom Learning Paths",
    desc: "Build tailored curricula aligned to your organization's competency frameworks.",
  },
]

const pricingTiers = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "For individual learners getting started.",
    features: [
      "Access to free courses",
      "Basic progress tracking",
      "Community forums",
      "Email support",
    ],
    cta: "Get started free",
    href: "/register",
    featured: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "For professionals serious about growth.",
    features: [
      "Unlimited course access",
      "Verified certificates",
      "Offline downloads",
      "Priority support",
      "Learning paths",
      "Skill assessments",
    ],
    cta: "Start free trial",
    href: "/register",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For teams and organizations that scale.",
    features: [
      "Everything in Pro",
      "Team analytics dashboard",
      "Custom learning paths",
      "SSO & integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    href: "#",
    featured: false,
  },
]

const sidebarNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: BookOpen, label: "Courses", active: false },
  { icon: BarChart3, label: "Progress", active: false },
  { icon: Calendar, label: "Calendar", active: false },
  { icon: Award, label: "Certificates", active: false },
  { icon: Settings, label: "Settings", active: false },
]

const dashboardMetrics = [
  { label: "Courses Completed", value: "12", icon: BookOpen },
  { label: "Hours Learned", value: "148", icon: Clock },
  { label: "Certificates", value: "8", icon: Award },
  { label: "Day Streak", value: "14", icon: TrendingUp },
]

const activeCourses = [
  { title: "Advanced React Patterns", progress: 78, lessons: "12/16" },
  { title: "System Design Fundamentals", progress: 45, lessons: "7/15" },
  { title: "Data Structures in Python", progress: 92, lessons: "23/25" },
  { title: "Machine Learning Basics", progress: 23, lessons: "4/18" },
]

const recentActivity = [
  { text: "Completed Module 12 in Advanced React Patterns", time: "2h ago" },
  { text: "Earned certificate in Python Data Structures", time: "Yesterday" },
  { text: "Started Machine Learning Basics", time: "2 days ago" },
  { text: "Scored 95% on System Design Quiz #3", time: "3 days ago" },
]

const upcomingDeadlines = [
  { title: "ML Basics Quiz #1", date: "Jun 15", type: "Quiz" },
  { title: "React Final Project", date: "Jun 18", type: "Project" },
  { title: "System Design Peer Review", date: "Jun 22", type: "Review" },
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
    title: "Expert Instructors",
    desc: "Learn from industry leaders with real-world experience and proven track records.",
  },
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    desc: "Carefully designed module-by-module paths that build skills progressively.",
  },
  {
    icon: Clock,
    title: "Self-Paced Learning",
    desc: "No deadlines. Learn on your schedule with lifetime access to every course.",
  },
  {
    icon: Shield,
    title: "Verified Certificates",
    desc: "Earn recognized credentials that showcase your expertise to employers.",
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
    <div className="flex flex-col bg-canvas">
      {/* STATS */}
      <section className="border-t border-graphite/10 py-20">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
            <AnimatedCounter value={stats.totalStudents} label="Students" />
            <AnimatedCounter value={stats.totalCourses} label="Courses" />
            <AnimatedCounter
              value={stats.totalInstructors}
              label="Instructors"
            />
            <AnimatedCounter value="4.9" label="Avg. rating" />
          </div>
        </div>
      </section>

      {/* TOP COURSES */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-5">
          <h2 className="mb-3 font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
            Top Courses
          </h2>
          <p className="mb-10 max-w-lg font-visueltpro text-[15px] leading-[1.6] font-light text-smoke">
            Our most sought-after courses, curated for maximum impact.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-xl bg-chalk"
                />
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

          <div className="mt-10 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-full border border-graphite/15 bg-chalk px-5 py-2.5 font-visueltpro text-sm font-medium text-void-black transition-colors hover:border-graphite/30"
            >
              View all courses <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-5 text-center">
          <h2 className="mb-3 font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
            Browse by category
          </h2>
          <p className="mx-auto mb-10 max-w-md font-visueltpro text-[15px] leading-[1.6] font-light text-smoke">
            Find exactly what you need across every discipline.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/courses?category=${cat.toLowerCase()}`}
                className="rounded-full border border-graphite/10 bg-chalk px-4 py-2 font-visueltpro text-sm font-light text-graphite transition-all hover:border-graphite/25 hover:bg-void-black hover:text-chalk"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-12 text-center">
            <h2 className="font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
              Why LMSio
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {features.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-graphite/10 bg-chalk p-7"
                >
                  <div className="mb-5 flex size-10 items-center justify-center rounded-full bg-void-black">
                    <Icon className="size-4 text-chalk" />
                  </div>
                  <h3 className="mb-2 font-visueltpro text-[18px] font-medium tracking-[-0.01em] text-void-black">
                    {item.title}
                  </h3>
                  <p className="font-visueltpro text-sm leading-[1.6] font-light text-smoke">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DEMO DASHBOARD */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-14 text-center">
            <h2 className="font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
              Your learning dashboard
            </h2>
            <p className="mx-auto mt-3 max-w-lg font-visueltpro text-[15px] leading-[1.6] font-light text-smoke">
              Track progress, manage courses, and celebrate milestones — all
              from one intuitive interface.
            </p>
          </div>

          {/* Dashboard mock */}
          <div
            className="overflow-hidden rounded-xl border border-graphite/10 bg-chalk"
            style={{ boxShadow: "var(--shadow-sq-hero)" }}
          >
            <div className="flex min-h-[480px]">
              {/* Sidebar */}
              <div className="hidden w-[210px] shrink-0 flex-col border-r border-graphite/8 bg-canvas md:flex">
                <div className="flex items-center gap-2 border-b border-graphite/8 px-4 py-3.5">
                  <div className="flex size-6 items-center justify-center rounded-sm bg-void-black">
                    <span className="font-visueltpro text-[9px] font-bold text-chalk">
                      L
                    </span>
                  </div>
                  <span className="font-visueltpro text-sm font-normal tracking-[-0.02em] text-void-black">
                    LMSio
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                  {sidebarNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                          item.active
                            ? "bg-chalk font-medium text-void-black"
                            : "text-smoke transition-colors hover:text-graphite"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span className="font-visueltpro text-[13px] font-light">
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-graphite/8 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-full bg-graphite/10">
                      <span className="font-visueltpro text-[10px] font-medium text-graphite">
                        JD
                      </span>
                    </div>
                    <div>
                      <div className="font-visueltpro text-xs font-medium text-void-black">
                        John Doe
                      </div>
                      <div className="font-visueltpro text-[10px] font-light text-smoke">
                        Pro Plan
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between border-b border-graphite/8 px-5 py-3">
                  <div>
                    <div className="font-visueltpro text-sm font-medium tracking-[-0.01em] text-void-black">
                      Welcome back, John
                    </div>
                    <div className="font-visueltpro text-[11px] font-light text-smoke">
                      Continue where you left off
                    </div>
                  </div>
                  <div className="rounded-full bg-canvas px-3 py-1 font-visueltpro text-[10px] font-medium tracking-[0.04em] text-graphite uppercase">
                    This week
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    {dashboardMetrics.map((m) => {
                      const Icon = m.icon
                      return (
                        <div
                          key={m.label}
                          className="rounded-lg border border-graphite/6 bg-canvas p-3"
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon className="size-3 text-smoke" />
                            <span className="font-visueltpro text-[9px] font-medium tracking-[0.05em] text-smoke uppercase">
                              {m.label}
                            </span>
                          </div>
                          <div className="mt-1.5 font-visueltpro text-xl font-medium tracking-[-0.02em] text-void-black">
                            {m.value}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Continue learning */}
                    <div className="rounded-lg border border-graphite/6 bg-canvas p-4 lg:col-span-2">
                      <h3 className="mb-3 font-visueltpro text-xs font-medium tracking-[-0.01em] text-void-black">
                        Continue Learning
                      </h3>
                      <div className="flex flex-col gap-3">
                        {activeCourses.map((c) => (
                          <div
                            key={c.title}
                            className="flex items-center gap-3 rounded-lg border border-graphite/6 bg-chalk p-2.5"
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas">
                              <Play className="size-3 text-graphite" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-visueltpro text-xs font-light text-void-black">
                                {c.title}
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-graphite/10">
                                  <div
                                    className="h-full rounded-full bg-void-black transition-all"
                                    style={{ width: `${c.progress}%` }}
                                  />
                                </div>
                                <span className="shrink-0 font-visueltpro text-[10px] font-light text-smoke">
                                  {c.progress}%
                                </span>
                              </div>
                            </div>
                            <span className="shrink-0 font-visueltpro text-[10px] font-light text-smoke">
                              {c.lessons}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-4">
                      {/* Upcoming */}
                      <div className="rounded-lg border border-graphite/6 bg-canvas p-4">
                        <h3 className="mb-3 font-visueltpro text-xs font-medium tracking-[-0.01em] text-void-black">
                          Upcoming
                        </h3>
                        <div className="flex flex-col gap-2.5">
                          {upcomingDeadlines.map((d) => (
                            <div
                              key={d.title}
                              className="flex items-center justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-visueltpro text-xs font-light text-graphite">
                                  {d.title}
                                </div>
                                <div className="font-visueltpro text-[10px] font-light text-smoke">
                                  {d.type}
                                </div>
                              </div>
                              <span className="shrink-0 rounded-full bg-chalk px-2 py-0.5 font-visueltpro text-[10px] font-medium text-graphite">
                                {d.date}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent activity */}
                      <div className="rounded-lg border border-graphite/6 bg-canvas p-4">
                        <h3 className="mb-3 font-visueltpro text-xs font-medium tracking-[-0.01em] text-void-black">
                          Recent Activity
                        </h3>
                        <div className="flex flex-col gap-2.5">
                          {recentActivity.map((a, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Circle className="mt-1 size-1.5 shrink-0 fill-smoke text-smoke" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-visueltpro text-xs font-light text-graphite">
                                  {a.text}
                                </div>
                                <div className="font-visueltpro text-[10px] font-light text-smoke">
                                  {a.time}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-void-black px-5 py-2.5 font-visueltpro text-sm font-medium text-chalk transition-opacity hover:opacity-90"
            >
              Try it yourself <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-12 text-center">
            <h2 className="font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
              Trusted by learners & leaders
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-graphite/10 bg-chalk p-6"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-3.5 fill-void-black text-void-black"
                    />
                  ))}
                </div>
                <p className="mb-5 font-visueltpro text-sm leading-[1.6] font-light text-graphite">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-graphite/8 pt-3">
                  <div className="font-visueltpro text-sm font-medium text-void-black">
                    {t.name}
                  </div>
                  <div className="font-visueltpro text-xs font-light text-smoke">
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENTERPRISE */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-6 text-center">
            <span className="inline-flex rounded-full border border-graphite/15 px-3 py-1 font-visueltpro text-[10px] font-medium tracking-[0.08em] text-smoke uppercase">
              Enterprise
            </span>
          </div>
          <h2 className="mb-3 text-center font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
            Built for teams that scale
          </h2>
          <p className="mx-auto mb-14 max-w-lg text-center font-visueltpro text-[15px] leading-[1.6] font-light text-smoke">
            Equip your entire organization with the skills to compete. LMSio
            Enterprise gives you the tools to manage, measure, and maximize
            learning at scale.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enterpriseFeatures.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-graphite/10 bg-chalk p-6"
                >
                  <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-void-black">
                    <Icon className="size-3.5 text-chalk" />
                  </div>
                  <h3 className="mb-1.5 font-visueltpro text-[16px] font-medium tracking-[-0.01em] text-void-black">
                    {item.title}
                  </h3>
                  <p className="font-visueltpro text-sm leading-[1.6] font-light text-smoke">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-void-black px-5 py-2.5 font-visueltpro text-sm font-medium text-chalk transition-opacity hover:opacity-90"
            >
              Request a demo <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-5">
          <div className="mb-14 text-center">
            <h2 className="font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
              Simple pricing
            </h2>
            <p className="mx-auto mt-3 max-w-md font-visueltpro text-[15px] leading-[1.6] font-light text-smoke">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 ${
                  tier.featured
                    ? "border-void-black bg-void-black"
                    : "border-graphite/10 bg-chalk"
                }`}
              >
                <h3
                  className={`font-visueltpro text-[10px] font-medium tracking-[0.08em] uppercase ${
                    tier.featured ? "text-chalk/60" : "text-smoke"
                  }`}
                >
                  {tier.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className={`font-bradford text-[36px] font-medium tracking-[-0.02em] ${
                      tier.featured ? "text-chalk" : "text-void-black"
                    }`}
                  >
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="font-visueltpro text-sm font-light text-smoke">
                      {tier.period}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 font-visueltpro text-sm font-light ${
                    tier.featured ? "text-chalk/50" : "text-smoke"
                  }`}
                >
                  {tier.desc}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 font-visueltpro text-sm"
                    >
                      <CheckCircle2
                        className={`mt-0.5 size-3.5 shrink-0 ${
                          tier.featured ? "text-chalk/40" : "text-smoke/60"
                        }`}
                      />
                      <span
                        className={
                          tier.featured
                            ? "font-light text-chalk/80"
                            : "font-light text-graphite"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`mt-6 flex w-full items-center justify-center rounded-full px-5 py-2.5 font-visueltpro text-sm font-medium transition-opacity hover:opacity-90 ${
                    tier.featured
                      ? "bg-chalk text-void-black"
                      : "bg-void-black text-chalk"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-[1280px] px-5 text-center">
          <h2 className="font-bradford text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-void-black">
            Ready to start learning?
          </h2>
          <p className="mx-auto mt-3 mb-10 max-w-md font-visueltpro text-[15px] leading-[1.6] font-light text-smoke">
            Join {stats.totalStudents}+ learners who have already chosen to grow
            with LMSio.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-void-black px-7 py-3 font-visueltpro text-sm font-medium text-chalk transition-opacity hover:opacity-90"
            >
              Create free account <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-graphite/15 px-7 py-3 font-visueltpro text-sm font-light text-graphite transition-colors hover:border-graphite/30"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
