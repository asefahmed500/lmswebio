/**
 * Enriches the demo database with real, connected activity.
 * Run after `npm run db:seed`:  npm run db:seed:enrich
 */
import { prisma } from "../lib/prisma"
import { gradeAnswer, normaliseCorrectAnswer } from "../lib/quiz"

const pick = <T>(items: T[], count: number): T[] =>
  [...items].sort(() => Math.random() - 0.5).slice(0, count)

async function main() {
  console.log("Enriching demo data...")

  // Clear only derived records so the script is safe to re-run.
  await prisma.lessonCompletion.deleteMany()
  await prisma.quizAttempt.deleteMany()
  await prisma.assignmentSubmission.deleteMany()
  await prisma.reviewHelpfulVote.deleteMany()
  await prisma.courseReview.deleteMany()
  await prisma.discussion.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.learningPathEnrollment.deleteMany()
  await prisma.learningPathCourse.deleteMany()
  await prisma.learningPath.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.userBadge.deleteMany()

  const [courses, students, instructors, quizzes, assignments, badges] =
    await Promise.all([
      prisma.course.findMany({
        include: { modules: { include: { lessons: true } } },
      }),
      prisma.user.findMany({ where: { role: "STUDENT" } }),
      prisma.user.findMany({ where: { role: "INSTRUCTOR" } }),
      prisma.quiz.findMany({ include: { questions: true } }),
      prisma.assignment.findMany(),
      prisma.badge.findMany(),
    ])

  let completions = 0
  let attempts = 0
  let submissions = 0
  let reviews = 0
  let certificates = 0

  for (const [index, course] of courses.entries()) {
    const lessons = course.modules.flatMap((module) => module.lessons)
    const enrolments = await prisma.enrolment.findMany({
      where: { courseId: course.id },
    })

    for (const [i, enrolment] of enrolments.entries()) {
      const target = [100, 75, 50, 25, 0][(index + i) % 5]
      const count = Math.round((target / 100) * lessons.length)

      if (count > 0) {
        await prisma.lessonCompletion.createMany({
          data: lessons.slice(0, count).map((lesson) => ({
            userId: enrolment.userId,
            lessonId: lesson.id,
          })),
        })
        completions += count
      }

      await prisma.enrolment.update({
        where: { id: enrolment.id },
        data: {
          progress: target,
          status: target === 100 ? "COMPLETED" : "ACTIVE",
          completedAt: target === 100 ? new Date() : null,
          lastAccessedAt: new Date(),
        },
      })

      if (target === 100) {
        await prisma.certificate.create({
          data: {
            userId: enrolment.userId,
            courseId: course.id,
            certificateUrl: `/certificates/verify-${course.slug}-${enrolment.userId}`,
            verificationId: `verify-${course.slug}-${enrolment.userId}`,
          },
        })
        certificates++
      }
    }

    // Quiz attempts with answers the grader can actually score.
    const quiz = quizzes.find((item) => item.courseId === course.id)
    if (quiz) {
      for (const student of pick(students, 3)) {
        const answers: Record<string, string | string[]> = {}
        let total = 0
        let earned = 0
        for (const question of quiz.questions) {
          const correct = await gradeAnswer(
            question.type,
            question.correctAnswer,
            undefined
          )
          const willAnswer = Math.random() > 0.2
          if (!willAnswer || correct === null) continue
          const isRight = Math.random() > 0.35
          const value = normaliseCorrectAnswer(question.correctAnswer)
          answers[question.id] = isRight
            ? typeof value === "string" || Array.isArray(value)
              ? value
              : "A"
            : "A"
          total += question.points
          earned += isRight ? question.points : 0
        }
        if (Object.keys(answers).length === 0) continue
        await prisma.quizAttempt.create({
          data: {
            quizId: quiz.id,
            userId: student.id,
            answers,
            score: total > 0 ? Math.round((earned / total) * 10000) / 100 : 0,
          },
        })
        attempts++
      }
    }

    // Assignment submissions.
    for (const assignment of assignments.filter(
      (item) => item.courseId === course.id
    )) {
      for (const student of pick(students, 3)) {
        const graded = Math.random() > 0.3
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            userId: student.id,
            textAnswer:
              "Completed using the course material and hands-on practice.",
            grade: graded
              ? Math.round(assignment.maxPoints * 0.85 * 100) / 100
              : null,
            feedback: graded ? "Clear, well-structured submission." : null,
            gradedAt: graded ? new Date() : null,
          },
        })
        submissions++
      }
    }

    // Course reviews.
    for (const student of pick(students, 3)) {
      await prisma.courseReview.create({
        data: {
          courseId: course.id,
          userId: student.id,
          rating: 4 + Math.round(Math.random()),
          review: "Practical, clearly structured and easy to follow.",
        },
      })
      reviews++
    }

    // Discussion with a threaded reply and a vote.
    const author = pick(students, 1)[0] ?? instructors[0]
    if (author) {
      const discussion = await prisma.discussion.create({
        data: {
          courseId: course.id,
          userId: author.id,
          title: `Question about ${course.title}`,
          content: "Which lesson did you find most useful, and why?",
          isPinned: index === 0,
        },
      })
      const replier = pick(instructors, 1)[0] ?? author
      await prisma.comment.create({
        data: {
          discussionId: discussion.id,
          userId: replier.id,
          content:
            "Start with the fundamentals lesson — it anchors everything else.",
        },
      })
      await prisma.discussionVote.create({
        data: { discussionId: discussion.id, userId: author.id, value: 1 },
      })
    }
  }

  // Instructor profiles.
  for (const instructor of instructors) {
    await prisma.instructorProfile.upsert({
      where: { userId: instructor.id },
      update: {},
      create: {
        userId: instructor.id,
        bio: "Teaching practical, project-based courses.",
        expertise: ["Curriculum design", "Hands-on workshops"],
        isFeatured: true,
      },
    })
  }

  // Learning paths from real published courses.
  const published = courses.filter((course) => course.isPublished).slice(0, 9)
  for (const [i, title] of [
    "Foundations",
    "Practitioner",
    "Specialist",
  ].entries()) {
    const path = await prisma.learningPath.create({
      data: {
        title,
        slug: `learning-path-${title.toLowerCase()}`,
        description: `A guided route through ${title.toLowerCase()} topics.`,
        level: "BEGINNER",
        estimatedDuration: 600,
        isPublished: true,
      },
    })
    const selected = published.slice(i * 3, i * 3 + 3)
    for (const [order, course] of selected.entries()) {
      await prisma.learningPathCourse.create({
        data: { learningPathId: path.id, courseId: course.id, order },
      })
    }
    for (const student of pick(students, 4)) {
      const enrolments = await prisma.enrolment.findMany({
        where: {
          userId: student.id,
          courseId: { in: selected.map((c) => c.id) },
        },
        select: { progress: true },
      })
      const progress = enrolments.length
        ? Math.round(
            enrolments.reduce((sum, item) => sum + item.progress, 0) /
              enrolments.length
          )
        : 0
      await prisma.learningPathEnrollment.create({
        data: { userId: student.id, learningPathId: path.id, progress },
      })
    }
  }

  // Calendar events with RSVPs.
  for (const course of courses.slice(0, 6)) {
    const event = await prisma.calendarEvent.create({
      data: {
        title: `${course.title} live Q&A`,
        description: "Office hours with the instructor.",
        eventType: "live_session",
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        courseId: course.id,
        createdBy: course.instructorId,
      },
    })
    for (const student of pick(students, 4)) {
      await prisma.calendarEventAttendee.create({
        data: {
          eventId: event.id,
          userId: student.id,
          status: Math.random() > 0.5 ? "going" : "maybe",
        },
      })
    }
  }

  for (const badge of badges) {
    for (const student of pick(students, 2)) {
      await prisma.userBadge.create({
        data: { userId: student.id, badgeId: badge.id },
      })
    }
  }

  console.log({
    completions,
    attempts,
    submissions,
    reviews,
    certificates,
    paths: 3,
  })
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exitCode = 1
})
