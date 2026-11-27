import { prisma } from "../../../lib/prisma"

export { prisma }

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function countRecords() {
  return {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    enrolments: await prisma.enrolment.count(),
    lessons: await prisma.lesson.count(),
    quizzes: await prisma.quiz.count(),
    attempts: await prisma.quizAttempt.count(),
    notes: await prisma.note.count(),
    discussions: await prisma.discussion.count(),
  }
}

export async function disconnect() {
  await prisma.$disconnect()
}
