import { expect, test } from "@playwright/test"
import { login } from "./helpers/auth"
import { cleanLog, watchConsole } from "./helpers/console"
import { prisma } from "./helpers/db"

test.describe("end-to-end business workflows", () => {
  test("admin creates a priced course and it persists", async ({ page }) => {
    await login(page, "ADMIN")
    const log = watchConsole(page)
    const title = `E2E Course ${Date.now()}`

    await page.goto("/admin/courses/new")
    await page.getByLabel("Course Title *").fill(title)
    await page
      .getByLabel("Description")
      .fill("Created by the automated browser test")
    await page.getByLabel("Category").fill("Testing")
    await page.getByLabel("Price (USD)").fill("19.99")

    const [createdResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/courses") && r.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Create Course" }).click(),
    ])
    const responseBody = await createdResponse.text().catch(() => "")
    expect(
      createdResponse.status(),
      `POST /api/courses → ${createdResponse.status()}: ${responseBody}`
    ).toBeLessThan(400)

    await expect(page).toHaveURL(/\/admin\/courses(?:$|[/?#])/, {
      timeout: 20_000,
    })

    const created = await prisma.course.findUnique({
      where: {
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      },
    })
    expect(created).not.toBeNull()
    expect(created!.price).toBe(19.99)

    // Delete through the real API with CSRF, then verify the database.
    const token = await (await page.request.get("/api/csrf-token")).json()
    const deleted = await page.request.delete(`/api/courses/${created!.id}`, {
      headers: { "X-CSRF-Token": token.token },
    })
    expect([200, 204]).toContain(deleted.status())
    expect(
      await prisma.course.findUnique({ where: { id: created!.id } })
    ).toBeNull()
    expect(cleanLog(log)).toEqual([])
  })

  test("student enrols in a free course and lesson completion updates progress", async ({
    page,
  }) => {
    const student = await prisma.user.findUnique({
      where: { email: "student@lms.com" },
    })
    const course = await prisma.course.findFirst({
      where: {
        isPublished: true,
        price: 0,
        modules: { some: { lessons: { some: {} } } },
      },
      orderBy: { createdAt: "desc" },
    })
    expect(course).not.toBeNull()

    // Previous runs may have already enrolled this student. Reset only this
    // fixture so the enrolment button appears and the test is repeatable.
    await prisma.lessonCompletion.deleteMany({
      where: {
        userId: student!.id,
        lesson: { module: { courseId: course!.id } },
      },
    })
    await prisma.enrolment.deleteMany({
      where: { userId: student!.id, courseId: course!.id },
    })

    await login(page, "STUDENT")

    // Enrol from the public course page (the real student entry point).
    await page.goto(`/courses/${course!.slug}`)
    await page.getByRole("button", { name: "Enrol for Free" }).click()
    await expect(
      page.getByText(/continue|enrolled|go to course/i).first()
    ).toBeVisible({
      timeout: 20_000,
    })

    // The enrol action stores one confirmation notification in the database.
    const notification = await prisma.notification.findFirst({
      where: {
        userId: student!.id,
        link: `/student/courses/${course!.id}`,
        type: "success",
      },
      orderBy: { createdAt: "desc" },
    })
    expect(notification).not.toBeNull()
    expect(notification!.title).toBe("You're enrolled")
    await prisma.notification.delete({ where: { id: notification!.id } })

    await page.goto(`/student/courses/${course!.id}`)
    await expect(
      page.getByRole("button", { name: "Mark Complete" })
    ).toBeVisible()

    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId: course!.id } },
    })
    await page.getByRole("button", { name: "Mark Complete" }).click()
    await expect(
      page.getByRole("button", { name: "Completed" }).first()
    ).toBeVisible()

    const enrolment = await prisma.enrolment.findUnique({
      where: { userId_courseId: { userId: student!.id, courseId: course!.id } },
    })
    const done = await prisma.lessonCompletion.count({
      where: {
        userId: student!.id,
        lesson: { module: { courseId: course!.id } },
      },
    })
    expect(done).toBeGreaterThan(0)
    expect(enrolment!.progress).toBe(Math.round((done / totalLessons) * 100))
  })

  test("student submits a quiz attempt and the score is stored", async ({
    page,
  }) => {
    const student = await prisma.user.findUnique({
      where: { email: "student@lms.com" },
    })
    const candidates = await prisma.quiz.findMany({
      where: {
        course: { enrolments: { some: { userId: student!.id } } },
        attemptsAllowed: { gt: 0 },
        questions: { some: { type: "MC_SINGLE" } },
      },
      include: { questions: true },
    })
    // Earlier runs consume attempts. Reset this quiz's attempts for the test
    // student so the allowance is deterministic in an isolated test database.
    const quiz = candidates[0]
    expect(quiz).toBeTruthy()
    await prisma.quizAttempt.deleteMany({
      where: { quizId: quiz!.id, userId: student!.id },
    })
    const before = 0
    expect(before).toBeLessThan(quiz!.attemptsAllowed)

    await login(page, "STUDENT")
    await page.goto(`/student/quizzes/${quiz!.id}`)
    await expect(
      page.getByRole("button", { name: "Submit Quiz" })
    ).toBeVisible()

    const single = quiz!.questions.filter((q) => q.type === "MC_SINGLE")
    for (const question of single) {
      const option = await page.locator(`label[for="${question.id}_A"]`).count()
      if (option) await page.locator(`label[for="${question.id}_A"]`).click()
    }
    await page.getByRole("button", { name: "Submit Quiz" }).click()
    await expect(page.getByText("Question Review")).toBeVisible({
      timeout: 20_000,
    })

    const after = await prisma.quizAttempt.count({
      where: { quizId: quiz!.id, userId: student!.id },
    })
    expect(after).toBe(before + 1)

    await prisma.quizAttempt.deleteMany({
      where: { quizId: quiz!.id, userId: student!.id },
    })
  })

  test("note created in the UI is saved to the database", async ({ page }) => {
    const student = await prisma.user.findUnique({
      where: { email: "student@lms.com" },
    })
    const enrolment = await prisma.enrolment.findFirst({
      where: { userId: student!.id, status: "ACTIVE" },
      include: {
        course: { include: { modules: { include: { lessons: true } } } },
      },
    })
    const lessonId = enrolment!.course.modules[0]?.lessons[0]?.id
    expect(lessonId).toBeTruthy()

    await login(page, "STUDENT")
    await page.goto("/student/notes")
    await page.getByRole("button", { name: "New Note" }).click()
    const dialog = page.getByRole("dialog", { name: "Create New Note" })
    await dialog.getByRole("combobox").click()
    const options = page.getByRole("option")
    await expect(options.first()).toBeVisible({ timeout: 10_000 })
    await options.first().click()

    const content = `Browser note ${Date.now()}`
    await page
      .getByPlaceholder("Start taking notes... (Markdown supported)")
      .fill(content)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(/saved/i).first()).toBeVisible({
      timeout: 10_000,
    })

    const note = await prisma.note.findFirst({
      where: { userId: student!.id, content },
    })
    expect(note).not.toBeNull()

    // Keep the isolated test database clean for repeat runs.
    await prisma.note.delete({ where: { id: note!.id } })
  })
})
