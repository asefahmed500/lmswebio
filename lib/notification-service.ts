import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  link?: string
  sendEmail?: boolean
}

export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      link: params.link,
    },
  })

  if (params.sendEmail) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, fullName: true },
    })

    if (user) {
      const settings = await prisma.settings.findFirst()
      if (settings?.emailNotifications) {
        await sendEmail({
          to: user.email,
          subject: params.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2>${params.title}</h2>
              <p>${params.message}</p>
              ${params.link ? `<a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${params.link}" style="color: #059669;">View Details</a>` : ""}
              <hr />
              <p style="color: #666; font-size: 12px;">LMS Platform</p>
            </div>
          `,
        })
      }
    }
  }

  return notification
}

export async function notifyEnrollment(
  userId: string,
  courseTitle: string,
  courseId: string
) {
  return createNotification({
    userId,
    title: "Course Enrolled",
    message: `You have been enrolled in "${courseTitle}".`,
    type: "success",
    link: `/student/courses/${courseId}`,
    sendEmail: true,
  })
}

export async function notifyGraded(
  userId: string,
  assignmentTitle: string,
  courseId: string,
  grade: number
) {
  return createNotification({
    userId,
    title: "Assignment Graded",
    message: `Your submission for "${assignmentTitle}" has been graded: ${grade}.`,
    type: "info",
    link: `/student/assignments/graded`,
    sendEmail: true,
  })
}

export async function notifyQuizResult(
  userId: string,
  quizTitle: string,
  score: number
) {
  return createNotification({
    userId,
    title: "Quiz Completed",
    message: `You scored ${score}% on "${quizTitle}".`,
    type: "info",
    link: `/student/quizzes/completed`,
    sendEmail: true,
  })
}

export async function notifyCoursePublished(
  userId: string,
  courseTitle: string,
  courseId: string
) {
  return createNotification({
    userId,
    title: "Course Published",
    message: `Your course "${courseTitle}" has been published.`,
    type: "success",
    link: `/instructor/courses/${courseId}`,
    sendEmail: true,
  })
}
