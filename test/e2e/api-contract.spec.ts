import { expect, test, type APIRequestContext } from "@playwright/test"
import { login } from "./helpers/auth"
import { prisma } from "./helpers/db"

async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get("/api/csrf-token")
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  return body.token as string
}

test.describe("API contract and access control", () => {
  test("public course endpoint works without authentication", async ({
    request,
  }) => {
    const course = await prisma.course.findFirst({
      where: { isPublished: true },
    })
    test.skip(!course, "no published course seeded")

    const byId = await request.get(`/api/courses/public/${course!.id}`)
    expect(byId.status()).toBe(200)

    const bySlug = await request.get(`/api/courses/public/${course!.slug}`)
    expect(bySlug.status()).toBe(200)
  })

  test("promotions API returns only active offers linked to real courses", async ({
    request,
  }) => {
    const response = await request.get("/api/promotions")
    expect(response.status()).toBe(200)
    const body = await response.json()
    const promotions = body.promotions as Array<{
      id: string
      title: string
      isActive?: boolean
      course: { id: string; slug: string } | null
    }>
    expect(promotions.length).toBeGreaterThan(0)
    for (const promotion of promotions) {
      expect(promotion.id).toBeTruthy()
      expect(promotion.title).toBeTruthy()
      expect(promotion.course).not.toBeNull()
      const course = await prisma.course.findUnique({
        where: { id: promotion.course!.id },
      })
      expect(course).not.toBeNull()
      expect(course!.isPublished).toBe(true)
    }
  })

  test("protected API rejects anonymous callers", async ({ request }) => {
    // 401 and 403 are both valid rejections; endpoints intentionally avoid
    // revealing whether a session exists. What matters is that no data leaks.
    for (const path of [
      "/api/enrolments/my",
      "/api/admin/users",
      "/api/notifications",
    ]) {
      const status = (await request.get(path)).status()
      expect([401, 403], `${path} returned ${status}`).toContain(status)
    }
  })

  test("mutations without a CSRF token are rejected", async ({ page }) => {
    await login(page, "ADMIN")
    const response = await page.request.post("/api/courses", { data: {} })
    expect(response.status()).toBe(403)
  })

  test("role escalation is blocked on admin and instructor APIs", async ({
    page,
  }) => {
    await login(page, "STUDENT")
    expect((await page.request.get("/api/admin/users")).status()).toBe(403)

    const token = await csrf(page.request)
    const instructor = (await prisma.user.findFirst({
      where: { role: "INSTRUCTOR" },
    }))!
    const patch = await page.request.patch(
      `/api/instructors/${instructor.id}`,
      {
        headers: { "X-CSRF-Token": token },
        data: { bio: "unauthorized" },
      }
    )
    expect(patch.status()).toBe(403)
  })

  test("IDOR: a student cannot read another user's enrolment progress", async ({
    page,
  }) => {
    const other = await prisma.user.findFirst({
      where: { role: { not: "STUDENT" } },
    })
    const enrolment = await prisma.enrolment.findFirst({
      where: {
        userId: {
          not: (await prisma.user.findUnique({
            where: { email: "student@lms.com" },
          }))!.id,
        },
      },
    })
    test.skip(!other || !enrolment, "no cross-user enrolment seeded")

    await login(page, "STUDENT")
    const response = await page.request.get(`/api/enrollments/${enrolment!.id}`)
    expect(response.status()).toBe(403)
  })

  test("invalid payloads return a client error, not a server error", async ({
    page,
  }) => {
    await login(page, "ADMIN")
    const token = await csrf(page.request)
    const response = await page.request.post("/api/courses", {
      headers: { "X-CSRF-Token": token },
      data: { title: "" },
    })
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  test("unknown routes return 404 without a server error", async ({
    request,
  }) => {
    const response = await request.get("/api/this-endpoint-does-not-exist")
    expect([401, 404]).toContain(response.status())
  })
})
