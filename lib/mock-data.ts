/**
 * Mock data loader utilities
 * Provides functions to load and filter mock data with simulated async delays
 */

import type {
  User,
  Course,
  Enrollment,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Role,
  WeeklyEnrollment,
  KPICard,
  CoursePerformance,
} from "@/types"

// Import mock JSON data
import usersData from "@/data/mock/users.json"
import coursesData from "@/data/mock/courses.json"
import enrollmentsData from "@/data/mock/enrollments.json"
import quizzesData from "@/data/mock/quizzes.json"
import quizAttemptsData from "@/data/mock/quiz-attempts.json"
import assignmentsData from "@/data/mock/assignments.json"
import assignmentSubmissionsData from "@/data/mock/assignment-submissions.json"

// Type assertions for imported JSON
const users = usersData as unknown as User[]
const courses = coursesData as unknown as Course[]
const enrollments = enrollmentsData as unknown as Enrollment[]
const quizzes = quizzesData as unknown as Quiz[]
const quizAttempts = quizAttemptsData as unknown as QuizAttempt[]
const assignments = assignmentsData as unknown as Assignment[]
const assignmentSubmissions =
  assignmentSubmissionsData as unknown as AssignmentSubmission[]

/**
 * Simulate async delay for realistic loading states
 * @param ms - Milliseconds to delay (default: 500ms)
 */
async function delay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================
// User Functions
// ============================================

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<User[]> {
  await delay()
  return [...users]
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | undefined> {
  await delay(200)
  return users.find((u) => u.id === id)
}

/**
 * Get user by email (for authentication)
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  await delay(300)
  return users.find((u) => u.email === email)
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: Role): Promise<User[]> {
  await delay()
  return users.filter((u) => u.role === role)
}

// ============================================
// Course Functions
// ============================================

/**
 * Get all courses with optional role-based filtering
 * @param userRole - User's role for filtering
 * @param userId - User's ID for instructor filtering
 */
export async function getCourses(
  userRole?: Role,
  userId?: string
): Promise<Course[]> {
  await delay()

  let filteredCourses = [...courses]

  // Filter by role
  if (userRole === "INSTRUCTOR" && userId) {
    // Instructors see only their courses
    filteredCourses = filteredCourses.filter((c) => c.instructorId === userId)
  } else if (userRole === "STUDENT") {
    // Students see only published courses
    filteredCourses = filteredCourses.filter((c) => c.isPublished)
  }
  // Admin sees all courses

  return filteredCourses
}

/**
 * Get course by ID with instructor populated
 */
export async function getCourseById(id: string): Promise<Course | undefined> {
  await delay(200)
  const course = courses.find((c) => c.id === id)
  if (course) {
    const instructor = users.find((u) => u.id === course.instructorId)
    return { ...course, instructor }
  }
  return undefined
}

/**
 * Get courses by instructor
 */
export async function getCoursesByInstructor(
  instructorId: string
): Promise<Course[]> {
  await delay()
  return courses.filter((c) => c.instructorId === instructorId)
}

// ============================================
// Enrollment Functions
// ============================================

/**
 * Get all enrollments
 */
export async function getEnrollments(): Promise<Enrollment[]> {
  await delay()
  return [...enrollments]
}

/**
 * Get enrollments for a specific student
 */
export async function getEnrollmentsByStudent(
  studentId: string
): Promise<Enrollment[]> {
  await delay()
  const studentEnrollments = enrollments.filter((e) => e.userId === studentId)

  // Populate course data for each enrollment
  return studentEnrollments.map((e) => ({
    ...e,
    course: courses.find((c) => c.id === e.courseId),
  }))
}

/**
 * Get enrollments for a specific course (instructor view)
 */
export async function getEnrollmentsByCourse(
  courseId: string
): Promise<Enrollment[]> {
  await delay()
  const courseEnrollments = enrollments.filter((e) => e.courseId === courseId)

  // Populate user data for each enrollment
  return courseEnrollments.map((e) => ({
    ...e,
    user: users.find((u) => u.id === e.userId),
  }))
}

// ============================================
// Quiz Functions
// ============================================

/**
 * Get all quizzes
 */
export async function getQuizzes(): Promise<Quiz[]> {
  await delay()
  return [...quizzes]
}

/**
 * Get quiz by ID
 */
export async function getQuizById(id: string): Promise<Quiz | undefined> {
  await delay(200)
  return quizzes.find((q) => q.id === id)
}

/**
 * Get quizzes by course
 */
export async function getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
  await delay()
  return quizzes.filter((q) => q.courseId === courseId)
}

/**
 * Get quiz attempts
 */
export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  await delay()
  return [...quizAttempts]
}

/**
 * Get quiz attempts by student
 */
export async function getQuizAttemptsByStudent(
  studentId: string
): Promise<QuizAttempt[]> {
  await delay()
  return quizAttempts.filter((a) => a.userId === studentId)
}

/**
 * Get quiz attempts by quiz
 */
export async function getQuizAttemptsByQuiz(
  quizId: string
): Promise<QuizAttempt[]> {
  await delay()
  const attempts = quizAttempts.filter((a) => a.quizId === quizId)

  // Populate user data
  return attempts.map((a) => ({
    ...a,
    user: users.find((u) => u.id === a.userId),
  }))
}

// ============================================
// Assignment Functions
// ============================================

/**
 * Get all assignments
 */
export async function getAssignments(): Promise<Assignment[]> {
  await delay()
  return [...assignments]
}

/**
 * Get assignment by ID
 */
export async function getAssignmentById(
  id: string
): Promise<Assignment | undefined> {
  await delay(200)
  return assignments.find((a) => a.id === id)
}

/**
 * Get assignments by course
 */
export async function getAssignmentsByCourse(
  courseId: string
): Promise<Assignment[]> {
  await delay()
  return assignments.filter((a) => a.courseId === courseId)
}

/**
 * Get assignment submissions
 */
export async function getAssignmentSubmissions(): Promise<
  AssignmentSubmission[]
> {
  await delay()
  return [...assignmentSubmissions]
}

/**
 * Get submissions by student
 */
export async function getSubmissionsByStudent(
  studentId: string
): Promise<AssignmentSubmission[]> {
  await delay()
  const submissions = assignmentSubmissions.filter(
    (s) => s.userId === studentId
  )

  // Populate assignment data
  return submissions.map((s) => ({
    ...s,
    assignment: assignments.find((a) => a.id === s.assignmentId),
  }))
}

/**
 * Get submissions by assignment (instructor grading view)
 */
export async function getSubmissionsByAssignment(
  assignmentId: string
): Promise<AssignmentSubmission[]> {
  await delay()
  const submissions = assignmentSubmissions.filter(
    (s) => s.assignmentId === assignmentId
  )

  // Populate user data
  return submissions.map((s) => ({
    ...s,
    user: users.find((u) => u.id === s.userId),
  }))
}

/**
 * Get pending grading count for an instructor
 */
export async function getPendingGradingCount(
  instructorId: string
): Promise<number> {
  await delay(200)

  // Get instructor's course IDs
  const instructorCourseIds = courses
    .filter((c) => c.instructorId === instructorId)
    .map((c) => c.id)

  // Get assignments for those courses
  const assignmentIds = assignments
    .filter((a) => instructorCourseIds.includes(a.courseId))
    .map((a) => a.id)

  // Count ungraded submissions
  return assignmentSubmissions.filter(
    (s) => assignmentIds.includes(s.assignmentId) && s.grade === null
  ).length
}

// ============================================
// Analytics Functions
// ============================================

/**
 * Get admin dashboard KPI cards
 */
export async function getAdminKPIs(): Promise<KPICard[]> {
  await delay()

  const totalUsers = users.filter((u) => u.role !== "ADMIN").length
  const totalCourses = courses.length
  const totalEnrollments = enrollments.length
  const activeStudents = enrollments.filter((e) => e.status === "ACTIVE").length

  return [
    {
      label: "Total Users",
      value: totalUsers,
      change: 12,
      trend: "up",
    },
    {
      label: "Total Courses",
      value: totalCourses,
      change: 8,
      trend: "up",
    },
    {
      label: "Total Enrollments",
      value: totalEnrollments,
      change: 15,
      trend: "up",
    },
    {
      label: "Active Students",
      value: activeStudents,
      change: 5,
      trend: "up",
    },
  ]
}

/**
 * Get weekly enrollment data for charts
 */
export async function getWeeklyEnrollments(): Promise<WeeklyEnrollment[]> {
  await delay()

  // Mock weekly data for the last 8 weeks
  const data: WeeklyEnrollment[] = [
    { week: "Week 1", enrollments: 12 },
    { week: "Week 2", enrollments: 18 },
    { week: "Week 3", enrollments: 24 },
    { week: "Week 4", enrollments: 20 },
    { week: "Week 5", enrollments: 32 },
    { week: "Week 6", enrollments: 28 },
    { week: "Week 7", enrollments: 35 },
    { week: "Week 8", enrollments: 42 },
  ]

  return data
}

/**
 * Get instructor dashboard KPIs
 */
export async function getInstructorKPIs(
  instructorId: string
): Promise<KPICard[]> {
  await delay()

  const instructorCourses = courses.filter(
    (c) => c.instructorId === instructorId
  )
  const courseIds = instructorCourses.map((c) => c.id)

  const courseEnrollments = enrollments.filter((e) =>
    courseIds.includes(e.courseId)
  )

  const totalStudents = new Set(courseEnrollments.map((e) => e.userId)).size
  const pendingGrading = await getPendingGradingCount(instructorId)
  const avgCompletion =
    courseEnrollments.reduce((sum, e) => sum + e.progress, 0) /
    (courseEnrollments.length || 1)

  return [
    {
      label: "My Courses",
      value: instructorCourses.length,
    },
    {
      label: "Total Students",
      value: totalStudents,
      change: 8,
      trend: "up",
    },
    {
      label: "Pending Grading",
      value: pendingGrading,
    },
    {
      label: "Avg Completion",
      value: `${Math.round(avgCompletion)}%`,
      change: 5,
      trend: "up",
    },
  ]
}

/**
 * Get course performance data for instructor
 */
export async function getCoursePerformance(
  instructorId: string
): Promise<CoursePerformance[]> {
  await delay()

  const instructorCourses = courses.filter(
    (c) => c.instructorId === instructorId
  )

  return instructorCourses.map((course) => {
    const courseEnrollments = enrollments.filter(
      (e) => e.courseId === course.id
    )
    const totalStudents = courseEnrollments.length
    const avgProgress =
      courseEnrollments.reduce((sum, e) => sum + e.progress, 0) /
      (totalStudents || 1)
    const completedStudents = courseEnrollments.filter(
      (e) => e.status === "COMPLETED"
    ).length
    const completionRate =
      totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0

    return {
      courseId: course.id,
      courseName: course.title,
      totalStudents,
      averageProgress: Math.round(avgProgress),
      completionRate: Math.round(completionRate),
    }
  })
}

/**
 * Get student dashboard KPIs
 */
export async function getStudentKPIs(studentId: string): Promise<KPICard[]> {
  await delay()

  const studentEnrollments = enrollments.filter((e) => e.userId === studentId)
  const activeEnrollments = studentEnrollments.filter(
    (e) => e.status === "ACTIVE"
  )
  const completedCourses = studentEnrollments.filter(
    (e) => e.status === "COMPLETED"
  ).length

  const avgProgress =
    studentEnrollments.reduce((sum, e) => sum + e.progress, 0) /
    (studentEnrollments.length || 1)

  // Count upcoming deadlines (assignments due in next 7 days)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const courseIds = studentEnrollments.map((e) => e.courseId)
  const upcomingDeadlines = assignments.filter(
    (a) =>
      courseIds.includes(a.courseId) &&
      a.dueDate &&
      new Date(a.dueDate) > now &&
      new Date(a.dueDate) <= nextWeek
  ).length

  return [
    {
      label: "Enrolled Courses",
      value: activeEnrollments.length,
    },
    {
      label: "Completed Courses",
      value: completedCourses,
    },
    {
      label: "Avg Progress",
      value: `${Math.round(avgProgress)}%`,
    },
    {
      label: "Upcoming Deadlines",
      value: upcomingDeadlines,
    },
  ]
}

// ============================================
// Authentication (Mock)
// ============================================

/**
 * Mock authentication function
 * In production, this would call a real API
 */
export async function mockLogin(
  email: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  password: string
): Promise<User | null> {
  await delay(800)

  // For demo purposes, any password works if email exists
  const user = users.find((u) => u.email === email)
  return user || null
}

/**
 * Mock user data for testing different roles
 */
export const mockUsers = {
  admin: users.find((u) => u.role === "ADMIN")!,
  instructor: users.find((u) => u.role === "INSTRUCTOR")!,
  student: users.find((u) => u.role === "STUDENT")!,
}
