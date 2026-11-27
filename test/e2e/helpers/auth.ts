import { expect, type Page } from "@playwright/test"

export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT"

export const accounts: Record<Role, { email: string; password: string }> = {
  ADMIN: { email: "admin@lms.com", password: "Admin123!" },
  INSTRUCTOR: { email: "instructor@lms.com", password: "Instructor123!" },
  STUDENT: { email: "student@lms.com", password: "Student123!" },
}

export async function login(page: Page, role: Role) {
  const account = accounts[role]
  await page.goto("/login")
  await page.getByLabel("Email address").fill(account.email)
  await page.getByLabel("Password", { exact: true }).fill(account.password)
  await page.getByRole("button", { name: "Sign in" }).click()
  const landing = `/${role.toLowerCase()}`
  await expect(page).toHaveURL(new RegExp(`${landing}$`), { timeout: 20_000 })
}

export async function logout(page: Page) {
  await page.goto("/student")
  const menu = page
    .getByRole("button", { name: /account|profile|user/i })
    .first()
  if (await menu.count()) {
    await menu.click()
    const item = page
      .getByRole("menuitem", { name: /sign out|log out/i })
      .first()
    if (await item.count()) await item.click()
  }
}
