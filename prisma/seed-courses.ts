import { prisma } from "../lib/prisma"

/**
 * Idempotent seed of additional real courses, categories and lesson content.
 * These are published, browsable courses — not placeholder UI cards.
 */
const COURSES = [
  {
    title: "Data Analysis with Python",
    category: "Data Science",
    level: "BEGINNER" as const,
    price: 0,
    description:
      "Learn to clean, explore and visualise real datasets using pandas and matplotlib.",
    modules: [
      {
        title: "Getting started with data",
        lessons: ["Why data analysis matters", "Loading your first dataset"],
      },
      {
        title: "Exploring and cleaning data",
        lessons: ["Handling missing values", "Grouping and aggregation"],
      },
    ],
  },
  {
    title: "UI Design Fundamentals",
    category: "Design",
    level: "BEGINNER" as const,
    price: 29,
    description:
      "Master layout, typography and colour for clean, accessible product interfaces.",
    modules: [
      {
        title: "Design foundations",
        lessons: ["Visual hierarchy", "Typography that scales"],
      },
      {
        title: "Building consistent interfaces",
        lessons: ["Spacing systems", "Colour and state"],
      },
    ],
  },
  {
    title: "Product Management Essentials",
    category: "Business",
    level: "INTERMEDIATE" as const,
    price: 39,
    description:
      "Turn ideas into shipped products with discovery, prioritisation and measurement.",
    modules: [
      {
        title: "Discovery",
        lessons: ["Understanding the problem", "Talking to customers"],
      },
      {
        title: "Delivery",
        lessons: ["Prioritisation frameworks", "Measuring outcomes"],
      },
    ],
  },
  {
    title: "Docker and CI for Developers",
    category: "DevOps",
    level: "INTERMEDIATE" as const,
    price: 49,
    description:
      "Containerise applications and ship them through a repeatable delivery pipeline.",
    modules: [
      {
        title: "Containers",
        lessons: ["Images and layers", "Compose for local development"],
      },
      {
        title: "Continuous integration",
        lessons: ["Automating checks", "Deploying safely"],
      },
    ],
  },
  {
    title: "iOS Development with Swift",
    category: "Mobile Development",
    level: "ADVANCED" as const,
    price: 59,
    description:
      "Build native iOS apps with SwiftUI, state management and real device testing.",
    modules: [
      {
        title: "SwiftUI basics",
        lessons: ["Views and modifiers", "State and binding"],
      },
      {
        title: "Shipping an app",
        lessons: ["Navigation patterns", "Preparing a release"],
      },
    ],
  },
  {
    title: "Photography for Storytellers",
    category: "Photography",
    level: "BEGINNER" as const,
    price: 0,
    description:
      "Use light, composition and sequence to tell a story with a camera.",
    modules: [
      {
        title: "Seeing light",
        lessons: ["Natural light", "Composition basics"],
      },
      {
        title: "Telling a story",
        lessons: ["Sequencing images", "Editing with intent"],
      },
    ],
  },
]

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

async function main() {
  const instructor = await prisma.user.findFirst({
    where: { role: "INSTRUCTOR" },
  })
  if (!instructor)
    throw new Error("Seed an instructor before running this script")

  let created = 0
  for (const course of COURSES) {
    const slug = slugify(course.title)
    const existing = await prisma.course.findUnique({ where: { slug } })
    if (existing) continue

    await prisma.course.create({
      data: {
        title: course.title,
        slug,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        isPublished: true,
        instructorId: instructor.id,
        tags: [course.category.toLowerCase().replace(/\s+/g, "-")],
        modules: {
          create: course.modules.map((module, moduleIndex) => ({
            title: module.title,
            order: moduleIndex + 1,
            lessons: {
              create: module.lessons.map((lesson, lessonIndex) => ({
                title: lesson,
                order: lessonIndex + 1,
                contentType: "text",
                content: `Lesson notes for ${lesson}.`,
              })),
            },
          })),
        },
      },
    })
    created += 1
  }

  const categories = await prisma.course.findMany({
    where: { isPublished: true },
    select: { category: true },
    distinct: ["category"],
  })
  console.log(
    `Created ${created} courses. Published categories: ${categories
      .map((c) => c.category)
      .filter(Boolean)
      .sort()
      .join(", ")}`
  )
  await prisma.$disconnect()
}

void main()
