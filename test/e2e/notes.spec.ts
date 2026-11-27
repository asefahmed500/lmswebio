import { expect, test } from "@playwright/test"
import { login } from "./helpers/auth"
import { cleanLog, watchConsole } from "./helpers/console"
import { prisma } from "./helpers/db"

test.describe("student notes — real data and CRUD", () => {
  test("notes page renders real notes from the API and database", async ({
    page,
  }) => {
    const student = await prisma.user.findUnique({
      where: { email: "student@lms.com" },
    })
    expect(student).not.toBeNull()

    const dbNotes = await prisma.note.count({ where: { userId: student!.id } })

    await login(page, "STUDENT")
    const log = watchConsole(page)

    const response = await page.goto("/student/notes")
    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole("heading", { name: "My Notes", level: 1 })
    ).toBeVisible()

    await page.waitForLoadState("networkidle")
    const apiNotes = await page.evaluate(async () => {
      const res = await fetch("/api/notes", { credentials: "include" })
      const body = await res.json()
      return { status: res.status, count: (body.notes ?? []).length }
    })
    expect(apiNotes.status).toBe(200)
    expect(apiNotes.count).toBe(dbNotes)

    // Empty state must be real, not a decorative placeholder.
    if (dbNotes === 0) {
      await expect(page.getByText("No notes yet")).toBeVisible()
    }
    expect(cleanLog(log)).toEqual([])
  })

  test("note search filters the real list", async ({ page }) => {
    await login(page, "STUDENT")
    await page.goto("/student/notes")
    await expect(page.getByPlaceholder("Search notes...")).toBeVisible()

    await page.getByPlaceholder("Search notes...").fill("zzz-no-such-note-zzz")
    await expect(page.getByText("No notes yet")).toBeVisible({
      timeout: 15_000,
    })

    await page.getByPlaceholder("Search notes...").fill("")
    await expect(page.getByPlaceholder("Search notes...")).toBeVisible()
  })

  test("note created through the API appears in the UI and persists", async ({
    page,
  }) => {
    const student = (await prisma.user.findUnique({
      where: { email: "student@lms.com" },
    }))!
    const lesson = await prisma.lesson.findFirst({
      where: {
        module: {
          course: { enrolments: { some: { userId: student.id } } },
        },
      },
    })
    test.skip(!lesson, "no enrolled lesson available for note creation")

    const content = `E2E note ${Date.now()}`
    await login(page, "STUDENT")

    const token = await (await page.request.get("/api/csrf-token")).json()
    const created = await page.request.post("/api/notes", {
      headers: { "X-CSRF-Token": token.token },
      data: { lessonId: lesson!.id, content },
    })
    expect([200, 201]).toContain(created.status())

    const dbNote = await prisma.note.findFirst({
      where: { userId: student.id, content },
    })
    expect(dbNote).not.toBeNull()

    await page.goto("/student/notes")
    await expect(page.getByText(content).first()).toBeVisible({
      timeout: 20_000,
    })
    await page.reload()
    await expect(page.getByText(content).first()).toBeVisible()

    await page.request.delete(`/api/notes/${dbNote!.id}`, {
      headers: { "X-CSRF-Token": token.token },
    })
    expect(
      await prisma.note.findUnique({ where: { id: dbNote!.id } })
    ).toBeNull()
  })
})
