/**
 * Authorization helpers to prevent IDOR vulnerabilities
 * Ensures users can only access resources they own or have permission to access
 */

import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

/**
 * Check if user can access a course
 */
export async function canAccessCourse(
  userId: string,
  courseId: string,
  userRole: Role
): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true, isPublished: true },
  })

  if (!course) {
    return false
  }

  // Admin can access all courses
  if (userRole === "ADMIN") {
    return true
  }

  // Instructor can access their own courses
  if (userRole === "INSTRUCTOR" && course.instructorId === userId) {
    return true
  }

  // Students can only access published courses
  if (userRole === "STUDENT" && course.isPublished) {
    // Check if enrolled
    const enrollment = await prisma.enrolment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    })

    return !!enrollment
  }

  return false
}

/**
 * Check if user is enrolled in a course
 */
export async function isEnrolledInCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const enrollment = await prisma.enrolment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  })

  return !!enrollment
}

/**
 * Check if user owns a resource
 */
export async function ownsResource(
  userId: string,
  resourceType: "submission" | "note" | "bookmark" | "comment" | "discussion",
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case "submission":
      const submission = await prisma.assignmentSubmission.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      })
      return submission?.userId === userId

    case "note":
      const note = await prisma.note.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      })
      return note?.userId === userId

    case "bookmark":
      const bookmark = await prisma.bookmark.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      })
      return bookmark?.userId === userId

    case "comment":
      const comment = await prisma.comment.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      })
      return comment?.userId === userId

    case "discussion":
      const discussion = await prisma.discussion.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      })
      return discussion?.userId === userId

    default:
      return false
  }
}

/**
 * Check if user can modify a course
 */
export async function canModifyCourse(
  userId: string,
  courseId: string,
  userRole: Role
): Promise<boolean> {
  if (userRole === "ADMIN") {
    return true
  }

  if (userRole === "INSTRUCTOR") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    })

    return course?.instructorId === userId
  }

  return false
}

/**
 * Check if user can access assignment submissions
 */
export async function canViewSubmissions(
  userId: string,
  assignmentId: string,
  userRole: Role
): Promise<boolean> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { courseId: true },
  })

  if (!assignment) {
    return false
  }

  return canModifyCourse(userId, assignment.courseId, userRole)
}

/**
 * Check if user can grade a submission
 */
export async function canGradeSubmission(
  userId: string,
  submissionId: string,
  userRole: Role
): Promise<boolean> {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    select: {
      assignment: {
        select: {
          courseId: true,
        },
      },
    },
  })

  if (!submission) {
    return false
  }

  return canModifyCourse(userId, submission.assignment.courseId, userRole)
}

/**
 * Get courses user has access to
 */
export async function getAccessibleCourses(userId: string, userRole: Role) {
  const where: Record<string, unknown> = {}

  if (userRole === "STUDENT") {
    where.isPublished = true
  } else if (userRole === "INSTRUCTOR") {
    where.instructorId = userId
  }

  return prisma.course.findMany({
    where,
    include: {
      instructor: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      _count: {
        select: {
          modules: true,
          enrolments: true,
        },
      },
    },
  })
}
