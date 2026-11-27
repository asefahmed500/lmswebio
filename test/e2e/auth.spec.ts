import { expect, test } from "@playwright/test"
import { accounts, login } from "./helpers/auth"
import { cleanLog, watchConsole } from "./helpers/console"

const roleLanding = {
  ADMIN: /\/admin$/,
  INSTRUCTOR: /\/instructor$/,
  STUDENT: /\/student$/,
} as const

test.describe("authentication", () => {
  test("public pages render without console errors", async ({ page }) => {
    const log = watchConsole(page)
    for (const path of [
      "/",
      "/courses",
      "/login",
      "/register",
      "/privacy",
      "/terms",
    ]) {
      await page.goto(path)
      await expect(page.locator("h1").first()).toBeVisible()
      // Let React hydration and data effects finish before navigating away.
      await page.waitForLoadState("networkidle")
    }
    expect(cleanLog(log)).toEqual([])
  })

  test("invalid credentials are rejected", async ({ page }) => {
    const log = watchConsole(page)
    await page.goto("/login")
    await page.getByLabel("Email address").fill("student@lms.com")
    await page.getByLabel("Password", { exact: true }).fill("wrong-password")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(
      page.getByText(/invalid|incorrect|error/i).first()
    ).toBeVisible()
    // A 401 from the login endpoint is the expected outcome of this test.
    expect(
      cleanLog(log).filter(
        (error) => !(error.includes("api/auth/login") && error.includes("401"))
      )
    ).toEqual([])
  })

  for (const role of ["ADMIN", "INSTRUCTOR", "STUDENT"] as const) {
    test(`${role} can log in and session survives reload`, async ({ page }) => {
      const log = watchConsole(page)
      await login(page, role)
      await expect(page).toHaveURL(roleLanding[role])
      await page.reload()
      await expect(page).toHaveURL(roleLanding[role])
      expect(cleanLog(log)).toEqual([])
    })
  }

  test("unauthenticated users are redirected from protected routes", async ({
    page,
  }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/login/)
    await page.goto("/student/courses/catalogue")
    await expect(page).toHaveURL(/\/login/)
  })

  test("students cannot reach the admin area", async ({ page }) => {
    await login(page, "STUDENT")
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/student/)
  })

  test("logout ends the session", async ({ page }) => {
    await login(page, "STUDENT")
    await page.getByRole("button", { name: "Log out" }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })
    await page.goto("/student")
    await expect(page).toHaveURL(/\/login/)
    expect(accounts.STUDENT.email).toBeTruthy()
  })
})
