import { expect, test, type Page } from "@playwright/test"
import { login, type Role } from "./helpers/auth"
import { cleanLog, watchConsole } from "./helpers/console"

const ROUTES: Record<Role, string[]> = {
  ADMIN: [
    "/admin",
    "/admin/users",
    "/admin/users/instructors",
    "/admin/users/students",
    "/admin/users/new",
    "/admin/courses",
    "/admin/courses/pending",
    "/admin/courses/categories",
    "/admin/courses/new",
    "/admin/quizzes",
    "/admin/quizzes/question-bank",
    "/admin/analytics",
    "/admin/analytics/enrollments",
    "/admin/settings",
    "/admin/settings/email",
    "/admin/settings/integrations",
    "/admin/notifications",
    "/admin/profile",
  ],
  INSTRUCTOR: [
    "/instructor",
    "/instructor/courses",
    "/instructor/courses/new",
    "/instructor/courses/drafts",
    "/instructor/assignments/grading",
    "/instructor/assignments/submissions",
    "/instructor/assignments/new",
    "/instructor/quizzes",
    "/instructor/quizzes/new",
    "/instructor/quizzes/results",
    "/instructor/analytics",
    "/instructor/analytics/students",
    "/instructor/notifications",
    "/instructor/profile",
  ],
  STUDENT: [
    "/student",
    "/student/my-learning/enrolled",
    "/student/courses/catalogue",
    "/student/my-learning/continue",
    "/student/assignments/pending",
    "/student/assignments/submitted",
    "/student/assignments/graded",
    "/student/quizzes/upcoming",
    "/student/quizzes/completed",
    "/student/certificates",
    "/student/achievements/badges",
    "/student/achievements/progress",
    "/student/discussions",
    "/student/learning-paths",
    "/student/notes",
    "/student/calendar",
    "/student/notifications",
    "/student/profile",
  ],
}

async function visitAll(page: Page, paths: string[], role: Role) {
  const log = watchConsole(page)
  for (const path of paths) {
    await page.goto(path)
    await page.waitForLoadState("domcontentloaded")
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
    const body = await page.locator("body").innerText()
    expect
      .soft(body.trim().length, `${role} ${path} rendered empty`)
      .toBeGreaterThan(20)
    expect
      .soft(
        body.toLowerCase().includes("coming soon"),
        `${role} ${path} is a stub`
      )
      .toBe(false)
  }
  const errors = cleanLog(log)
  expect.soft(errors, `${role}: browser errors`).toEqual([])
}

for (const role of ["ADMIN", "INSTRUCTOR", "STUDENT"] as const) {
  test(`${role}: all ${ROUTES[role].length} dashboard routes render`, async ({
    page,
  }) => {
    await login(page, role)
    await visitAll(page, ROUTES[role], role)
  })
}
