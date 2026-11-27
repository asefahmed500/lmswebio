import { expect, test, type APIRequestContext } from "@playwright/test"
import { login } from "./helpers/auth"
import { prisma } from "./helpers/db"

async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get("/api/csrf-token")
  const body = await response.json()
  return body.token as string
}

test.describe("authorization and data integrity", () => {
  test("student cannot enumerate other enrolments or emails", async ({
    page,
  }) => {
    const request = page.request
    await login(page, "STUDENT")
    const course = await prisma.course.findFirst({
      where: { isPublished: true },
      select: { id: true },
    })
    expect(course).not.toBeNull()

    const response = await request.get(
      `/api/enrollments?courseId=${course!.id}`
    )
    expect(response.status()).toBe(200)
    const body = await response.json()
    const enrolments = body.enrollments as { user: { email?: string } }[]
    const student = await prisma.user.findUnique({
      where: { email: "student@lms.com" },
    })
    expect(enrolments.length).toBeLessThanOrEqual(1)
    for (const enrolment of enrolments) {
      expect(enrolment.user.email).toBeUndefined()
    }
    if (enrolments.length) {
      expect(enrolments[0].user.id).toBe(student!.id)
    }
  })

  test("student cannot create notifications", async ({ page }) => {
    const request = page.request
    await login(page, "STUDENT")
    const token = await csrf(request)
    const response = await request.post("/api/notifications", {
      headers: { "X-CSRF-Token": token },
      data: {
        userId: (await prisma.user.findUnique({
          where: { email: "admin@lms.com" },
        }))!.id,
        title: "Escalation attempt",
        message: "Should not be allowed",
      },
    })
    expect(response.status()).toBe(403)
  })

  test("instructor profile API hides email and rejects student edits", async ({
    page,
  }) => {
    const request = page.request
    const instructor = (await prisma.user.findFirst({
      where: { role: "INSTRUCTOR" },
    }))!
    await login(page, "STUDENT")
    const get = await request.get(`/api/instructors/${instructor.id}`)
    expect(get.status()).toBe(200)
    expect((await get.json()).profile.user.email).toBeUndefined()

    const token = await csrf(request)
    const patch = await request.patch(`/api/instructors/${instructor.id}`, {
      headers: { "X-CSRF-Token": token },
      data: { bio: "unauthorized" },
    })
    expect(patch.status()).toBe(403)
  })

  test("unauthenticated mutations are rejected", async ({ page }) => {
    const response = await page.request.post("/api/courses", { data: {} })
    expect([401, 403]).toContain(response.status())
  })

  test("student cannot reach admin APIs", async ({ page }) => {
    await login(page, "STUDENT")
    const response = await page.request.get("/api/admin/users")
    expect(response.status()).toBe(403)
  })
})
