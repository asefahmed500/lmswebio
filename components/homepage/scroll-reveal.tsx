"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right"
  delay?: number
  duration?: number
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 600,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(node)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const transforms: Record<string, string> = {
    up: "translateY(24px)",
    down: "translateY(-24px)",
    left: "translateX(24px)",
    right: "translateX(-24px)",
  }

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0)" : transforms[direction],
        transition: `opacity ${duration}ms cubic-bezier(0.21, 0.47, 0.32, 1), transform ${duration}ms cubic-bezier(0.21, 0.47, 0.32, 1)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
