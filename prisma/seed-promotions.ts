import { prisma } from "../lib/prisma"

/**
 * Idempotent seed for the real promotions shown in the catalogue.
 * Every offer links to an actual published course in the database — there are
 * no placeholder rows or fabricated UI data.
 */
const OFFERS = [
  {
    title: "Featured this week",
    description:
      "Our most enrolled course, now with a limited-time reduction for new learners.",
    badge: "Popular",
    discountPercent: 20,
  },
  {
    title: "Start learning for less",
    description:
      "A beginner-friendly course at a reduced price to help you get started.",
    badge: "Beginner",
    discountPercent: 15,
  },
  {
    title: "Level up your skills",
    description:
      "Go further with an intermediate course at a special rate this month.",
    badge: "Upgrade",
    discountPercent: 10,
  },
]

async function main() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: OFFERS.length,
    select: { id: true, title: true, isPublished: true },
  })
  console.log(`Published courses found: ${courses.length}`)

  for (const [index, offer] of OFFERS.entries()) {
    const course = courses[index]
    if (!course) continue

    const data = { ...offer, courseId: course.id, isActive: true }
    const existing = await prisma.promotion.findFirst({
      where: { title: offer.title },
    })
    if (existing) {
      await prisma.promotion.update({ where: { id: existing.id }, data })
    } else {
      await prisma.promotion.create({ data })
    }
  }

  const count = await prisma.promotion.count({ where: { isActive: true } })
  console.log(`Active promotions: ${count}`)
  await prisma.$disconnect()
}

void main()
