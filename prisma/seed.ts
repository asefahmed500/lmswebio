import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required for seeding")
}

const pool = new Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const password = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe123!"
  const passwordHash = await bcrypt.hash(password, 12)

  console.log(`Using seed password: ${password}`)
  console.log("IMPORTANT: Change this password after first login!")

  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: {},
    create: {
      email: "admin@lms.com",
      fullName: "Admin User",
      passwordHash,
      role: "ADMIN",
    },
  })

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@lms.com" },
    update: {},
    create: {
      email: "instructor@lms.com",
      fullName: "Jane Instructor",
      passwordHash,
      role: "INSTRUCTOR",
    },
  })

  const student = await prisma.user.upsert({
    where: { email: "student@lms.com" },
    update: {},
    create: {
      email: "student@lms.com",
      fullName: "John Student",
      passwordHash,
      role: "STUDENT",
    },
  })

  console.log("Users:", [admin.email, instructor.email, student.email])

  const course1 = await prisma.course.upsert({
    where: { slug: "intro-to-web-dev" },
    update: {},
    create: {
      title: "Introduction to Web Development",
      slug: "intro-to-web-dev",
      description: "Learn HTML, CSS, and JavaScript fundamentals.",
      level: "BEGINNER",
      isPublished: true,
      instructorId: instructor.id,
      category: "Web Development",
      tags: ["html", "css", "javascript"],
      modules: {
        create: [
          {
            title: "Getting Started",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Welcome",
                  content:
                    "<h2>Welcome!</h2><p>Let's learn web development.</p>",
                  contentType: "text",
                  order: 1,
                },
                {
                  title: "Environment Setup",
                  content: "<h2>Setup</h2><p>Install VS Code and tools.</p>",
                  contentType: "text",
                  order: 2,
                },
              ],
            },
          },
          {
            title: "HTML Basics",
            order: 2,
            lessons: {
              create: [
                {
                  title: "Document Structure",
                  content:
                    "<h2>HTML Structure</h2><p>Learn doctype, head, body.</p>",
                  contentType: "text",
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.course.upsert({
    where: { slug: "python-data-science" },
    update: {},
    create: {
      title: "Python for Data Science",
      slug: "python-data-science",
      description: "Master Python for data analysis and ML.",
      level: "INTERMEDIATE",
      isPublished: true,
      instructorId: instructor.id,
      category: "Data Science",
      tags: ["python", "data-science"],
      modules: {
        create: [
          {
            title: "Python Fundamentals",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Intro to Python",
                  content:
                    "<h2>Python Overview</h2><p>Getting started with Python.</p>",
                  contentType: "text",
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.enrolment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course1.id } },
    update: {},
    create: {
      userId: student.id,
      courseId: course1.id,
      status: "ACTIVE",
      progress: 35,
    },
  })

  console.log("Seed complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
