"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, X, BookOpen, Play } from "lucide-react"
import Link from "next/link"
import { SynexNavbar } from "@/components/synex/Navbar"

export function SynexHero() {
  const rafRef = useRef<number | null>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      setAnimateIn(true)
    })
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section className="bg-canvas">
      {bannerVisible && (
        <div className="border-b border-graphite/10 bg-canvas">
          <div className="mx-auto flex h-10 max-w-[1280px] items-center justify-center gap-3 px-5">
            <span className="rounded-[9999px] bg-void-black px-2 py-0.5 font-visueltpro text-[10px] font-medium tracking-[0.06em] text-chalk uppercase">
              New
            </span>
            <span className="font-visueltpro text-sm font-light text-graphite">
              Introducing AI-powered learning paths — personalized for you.
            </span>
            <Link
              href="#"
              className="inline-flex items-center gap-1 font-visueltpro text-sm font-medium text-void-black hover:opacity-70"
            >
              Learn more <ArrowRight className="size-3" />
            </Link>
            <button
              onClick={() => setBannerVisible(false)}
              className="absolute right-5 text-smoke transition-colors hover:text-graphite"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <SynexNavbar />

      <div className="mx-auto max-w-[1280px] px-5 pt-24 pb-0 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={animateIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mx-auto max-w-[820px] font-bradford text-[clamp(36px,7vw,64px)] leading-[1.05] font-medium tracking-[-0.03em] text-void-black">
            Great careers start with great courses.
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] font-visueltpro text-base leading-[1.6] font-light text-smoke">
            Expert-led courses in technology, design, and business. Learn at
            your own pace, earn certificates, advance your career.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-[9999px] bg-void-black px-6 py-3 font-visueltpro text-sm font-medium text-chalk"
              style={{ boxShadow: "var(--shadow-sq-button)" }}
            >
              Get started for free <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-[9999px] border border-graphite/20 px-6 py-3 font-visueltpro text-sm font-light text-graphite transition-colors hover:border-graphite/40"
            >
              <Play className="size-3.5" />
              Browse courses
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={animateIn ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-16 max-w-[1100px] overflow-hidden rounded-[10px] border border-graphite/10 bg-chalk"
          style={{ boxShadow: "var(--shadow-sq-hero)" }}
        >
          <div className="flex items-center justify-between border-b border-graphite/10 bg-chalk px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-sm bg-void-black">
                <span className="font-visueltpro text-[9px] font-bold text-chalk">
                  L
                </span>
              </div>
              <span className="font-visueltpro text-xs font-light text-graphite">
                LMSio
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-smoke/30" />
              <div className="size-2 rounded-full bg-smoke/30" />
              <div className="size-2 rounded-full bg-smoke/30" />
            </div>
          </div>

          <div className="flex min-h-[320px]">
            <div className="hidden w-[180px] shrink-0 flex-col border-r border-graphite/10 bg-canvas/50 md:flex">
              <div className="p-3">
                {[
                  "Dashboard",
                  "Courses",
                  "Progress",
                  "Calendar",
                  "Certs",
                  "Settings",
                ].map((item, i) => (
                  <div
                    key={item}
                    className={`mb-0.5 rounded-md px-3 py-1.5 font-visueltpro text-xs font-light ${
                      i === 0
                        ? "bg-chalk font-medium text-void-black"
                        : "text-smoke"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-chalk p-4">
              <div className="mb-3 font-visueltpro text-sm font-medium text-void-black">
                Welcome back, John
              </div>
              <div className="mb-4 grid grid-cols-4 gap-2">
                {["12 Courses", "148 Hours", "8 Certs", "14d Streak"].map(
                  (s) => (
                    <div
                      key={s}
                      className="rounded-lg border border-graphite/8 bg-canvas p-2.5"
                    >
                      <div className="font-visueltpro text-lg font-medium text-void-black">
                        {s.split(" ")[0]}
                      </div>
                      <div className="font-visueltpro text-[10px] font-light text-smoke">
                        {s.split(" ").slice(1).join(" ")}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="space-y-2">
                {[
                  { t: "Advanced React Patterns", p: 78 },
                  { t: "System Design Fundamentals", p: 45 },
                  { t: "Data Structures in Python", p: 92 },
                ].map((c) => (
                  <div
                    key={c.t}
                    className="flex items-center gap-2 rounded-lg border border-graphite/8 bg-canvas p-2"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-chalk">
                      <BookOpen className="size-3 text-smoke" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-visueltpro text-xs font-light text-graphite">
                        {c.t}
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-graphite/10">
                        <div
                          className="h-full rounded-full bg-void-black"
                          style={{ width: `${c.p}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 font-visueltpro text-[10px] font-light text-smoke">
                      {c.p}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SynexHero
