import { defineConfig, devices } from "@playwright/test"

const TEST_DB_URL = "mongodb://localhost:27018/lmsio?replicaSet=rs0"
const BASE_URL = "http://localhost:3101"

// The test runner itself verifies database state, so it must use the same
// isolated replica set as the application server.
process.env.DATABASE_URL = TEST_DB_URL

export default defineConfig({
  testDir: "./test/e2e",
  outputDir: "./test/e2e/artifacts",
  timeout: 90_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "./test/e2e/report", open: "never" }],
    ["json", { outputFile: "./test/e2e/report/results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: false,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: false },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3101",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 240_000,
    env: {
      DATABASE_URL: TEST_DB_URL,
      LOGIN_RATE_LIMIT_MAX: "500",
    },
  },
})
