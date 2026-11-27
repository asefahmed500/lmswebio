import { expect, test } from "@playwright/test"
import { login, type Role } from "./helpers/auth"
import { cleanLog, watchConsole } from "./helpers/console"

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const

const ROUTES: Record<Role, string[]> = {
  ADMIN: [
    "/admin",
    "/admin/courses",
    "/admin/users",
    "/admin/analytics",
    "/admin/settings",
  ],
  INSTRUCTOR: [
    "/instructor",
    "/instructor/courses",
    "/instructor/assignments",
    "/instructor/quizzes",
    "/instructor/analytics",
  ],
  STUDENT: [
    "/student",
    "/student/notes",
    "/student/courses/catalogue",
    "/student/assignments",
    "/student/quizzes",
  ],
}

function overflow(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  )
}

for (const role of ["ADMIN", "INSTRUCTOR", "STUDENT"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`${role} ${viewport.name}: key pages have no horizontal overflow or browser errors`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      const log = watchConsole(page)
      await login(page, role)

      for (const path of ROUTES[role]) {
        await page.goto(path)
        await expect(page.locator("body")).toBeVisible()
        const overflowPx = await overflow(page)
        expect
          .soft(
            overflowPx,
            `${role} ${viewport.name} ${path} overflows by ${overflowPx}px`
          )
          .toBeLessThanOrEqual(1)
      }

      expect
        .soft(cleanLog(log), `${role} ${viewport.name}: browser errors`)
        .toEqual([])
    })
  }
}

test("public pages are responsive at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const log = watchConsole(page)
  for (const path of ["/", "/courses", "/login", "/privacy", "/terms"]) {
    await page.goto(path)
    await expect(page.locator("body")).toBeVisible()
    // Let hydration and data effects settle before moving on, so a late React
    // error isn't attributed to the next navigation.
    await page.waitForLoadState("networkidle")
    const overflowPx = await overflow(page)
    expect
      .soft(overflowPx, `${path} overflows by ${overflowPx}px`)
      .toBeLessThanOrEqual(1)
  }
  expect.soft(cleanLog(log), "public pages: browser errors").toEqual([])
})
