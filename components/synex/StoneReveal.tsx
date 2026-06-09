"use client"

import React, { useRef, useState } from "react"
import {
  type MotionStyle,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react"

interface StoneRevealProps {
  side: "left" | "right"
  baseSrc: string
  grassSrc: string
  height: number
  zBase: number
  // zGrass is used via CSS z-index on the overlay element
  zGrass?: number
}

export const StoneReveal = ({
  side,
  baseSrc,
  grassSrc,
  height,
  zBase,
  zGrass,
}: StoneRevealProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const radiusRaw = useMotionValue(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const radius = useSpring(radiusRaw, { stiffness: 200, damping: 25 })

  const mask = useTransform([radius, x, y], ([r, mx, my]) => {
    if (r === 0) return "none"
    return `radial-gradient(circle ${r}px at ${mx}px ${my}px, black 0%, black 40%, transparent 100%)`
  })

  const handleMouseEnter = () => {
    setIsHovered(true)
    radiusRaw.set(120)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    radiusRaw.set(0)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
  }

  const position = side === "left" ? "left bottom" : "right bottom"

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className="absolute bottom-0 w-fit cursor-crosshair"
      style={{
        left: side === "left" ? 0 : undefined,
        right: side === "right" ? 0 : undefined,
        height: `${height}px`,
        zIndex: zBase,
      }}
    >
      <motion.img
        src={baseSrc}
        alt=""
        style={{
          objectFit: "contain",
          objectPosition: position,
          width: "100%",
          height: "100%",
        }}
        initial={{ opacity: 0, x: side === "left" ? -40 : 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
      />

      <motion.img
        src={grassSrc}
        alt=""
        style={
          {
            objectFit: "contain",
            objectPosition: position,
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            WebkitMask: mask,
            mask: mask,
          } as MotionStyle
        }
        className="pointer-events-none"
      />
    </div>
  )
}
