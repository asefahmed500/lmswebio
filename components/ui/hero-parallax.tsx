"use client"

import React from "react"
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface Product {
  title: string
  link: string
  thumbnail: string
}

interface HeroParallaxProps {
  products: Product[]
}

export const HeroParallax = ({ products }: HeroParallaxProps) => {
  const firstRow = products.slice(0, 5)
  const secondRow = products.slice(5, 10)
  const thirdRow = products.slice(10, 15)
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 }

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  )
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  )
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  )
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  )
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  )
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  )

  return (
    <div
      ref={ref}
      className="relative flex h-[300vh] flex-col overflow-hidden py-40 antialiased [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="mb-20 flex flex-row-reverse space-x-20 space-x-reverse">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="mb-20 flex flex-row space-x-20">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-20 space-x-reverse">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export const Header = () => {
  return (
    <div className="relative top-0 left-0 z-10 mx-auto w-full max-w-7xl px-4 py-20 md:py-40">
      <h1 className="text-3xl leading-[0.95] font-[900] tracking-[-0.04em] text-foreground md:text-8xl lg:text-9xl">
        The Ultimate <br />
        <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
          Learning Platform
        </span>
      </h1>
      <p className="mt-10 max-w-2xl text-lg font-medium tracking-wide text-muted-foreground/90 md:text-2xl">
        Learn from expert instructors. Build skills. Earn certificates.
      </p>
      <div className="mt-12 flex flex-wrap items-center gap-6">
        <Link
          href="/register"
          className="inline-flex items-center gap-3 rounded-full bg-emerald-600 px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
        >
          Start Free <ArrowRight className="size-5" />
        </Link>
        <Link
          href="/courses"
          className="inline-flex items-center gap-3 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white/90 backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:text-white"
        >
          Browse Courses
        </Link>
      </div>
    </div>
  )
}

export const ProductCard = ({
  product,
  translate,
}: {
  product: Product
  translate: MotionValue<number>
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product relative h-96 w-[30rem] shrink-0"
    >
      <a
        href={product.link}
        className="block group-hover/product:shadow-2xl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.thumbnail}
          height="600"
          width="600"
          className="absolute inset-0 h-full w-full object-cover object-left-top"
          alt={product.title}
        />
      </a>
      <div className="pointer-events-none absolute inset-0 h-full w-full bg-black opacity-0 group-hover/product:opacity-80" />
      <h2 className="absolute bottom-4 left-4 font-semibold text-white opacity-0 group-hover/product:opacity-100">
        {product.title}
      </h2>
    </motion.div>
  )
}

export const products: Product[] = [
  {
    title: "Web Development",
    link: "/courses?category=Web+Development",
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
  },
  {
    title: "Data Science",
    link: "/courses?category=Data+Science",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
  },
  {
    title: "Cloud Computing",
    link: "/courses?category=Cloud+Computing",
    thumbnail:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",
  },
  {
    title: "Mobile Development",
    link: "/courses?category=Mobile+Development",
    thumbnail:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop",
  },
  {
    title: "Cybersecurity",
    link: "/courses?category=Cybersecurity",
    thumbnail:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop",
  },
  {
    title: "DevOps",
    link: "/courses?category=DevOps",
    thumbnail:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=600&fit=crop",
  },
  {
    title: "AI & Machine Learning",
    link: "/courses?category=AI",
    thumbnail:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
  },
  {
    title: "UX/UI Design",
    link: "/courses?category=Design",
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
  },
  {
    title: "Product Management",
    link: "/courses?category=Product",
    thumbnail:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
  },
  {
    title: "Blockchain",
    link: "/courses?category=Blockchain",
    thumbnail:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
  },
  {
    title: "Game Development",
    link: "/courses?category=Game+Development",
    thumbnail:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop",
  },
  {
    title: "Digital Marketing",
    link: "/courses?category=Marketing",
    thumbnail:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  },
]
