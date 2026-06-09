"use client"

import React, { useCallback, useEffect, useState, useRef } from "react"
import { motion, useAnimationControls } from "framer-motion"
import { cn } from "@/lib/utils"

interface LoopingWordsProps {
  words: string[]
  className?: string
}

export function LoopingWords({ words, className }: LoopingWordsProps) {
  const controls = useAnimationControls()
  const wordsRef = useRef<(HTMLLIElement | null)[]>([])
  const [selectorWidth, setSelectorWidth] = useState(0)

  const duplicatedWords = [...words, ...words]
  const totalOriginal = words.length

  const updateWidth = useCallback((index: number) => {
    const el = wordsRef.current[index]
    if (el) {
      setSelectorWidth(el.offsetWidth)
    }
  }, [])

  useEffect(() => {
    updateWidth(1)

    let index = 0
    const interval = setInterval(async () => {
      index++
      updateWidth((index % totalOriginal) + 1)

      await controls.start({
        y: `-${(index * 100) / duplicatedWords.length}%`,
        transition: { duration: 1.2, ease: [0.175, 0.885, 0.32, 1.15] },
      })

      if (index === totalOriginal) {
        index = 0
        controls.set({ y: "0%" })
      }
    }, 2200)

    return () => clearInterval(interval)
  }, [controls, totalOriginal, duplicatedWords.length, updateWidth])

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative h-[2.7em] overflow-hidden px-[0.2em] text-[11vw] leading-[0.9] font-bold whitespace-nowrap uppercase md:text-[6vw]">
        <motion.ul
          className="m-0 flex list-none flex-col items-center p-0"
          animate={controls}
          initial={{ y: "0%" }}
        >
          {duplicatedWords.map((word, i) => (
            <li
              key={i}
              ref={(el) => {
                wordsRef.current[i] = el
              }}
              className="tracking-tight text-foreground"
            >
              <p className="m-0">{word}</p>
            </li>
          ))}
        </motion.ul>

        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage:
              "linear-gradient(180deg, hsl(var(--background)) 5%, transparent 40%, transparent 60%, hsl(var(--background)) 95%)",
          }}
        />

        <motion.div
          className="pointer-events-none absolute top-1/2 left-1/2 z-20 h-[0.9em] -translate-x-1/2 -translate-y-1/2"
          animate={{ width: selectorWidth }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute top-0 left-0 h-[0.125em] w-[0.125em] border-t-[0.035em] border-l-[0.035em] border-primary" />
          <div className="absolute top-0 right-0 h-[0.125em] w-[0.125em] border-t-[0.035em] border-r-[0.035em] border-primary" />
          <div className="absolute bottom-0 left-0 h-[0.125em] w-[0.125em] border-b-[0.035em] border-l-[0.035em] border-primary" />
          <div className="absolute right-0 bottom-0 h-[0.125em] w-[0.125em] border-r-[0.035em] border-b-[0.035em] border-primary" />
        </motion.div>
      </div>
    </div>
  )
}
