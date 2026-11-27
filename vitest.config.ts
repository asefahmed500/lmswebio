import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    // Playwright owns test/e2e/**/*.spec.ts. Vitest must only collect unit and
    // component tests, otherwise Playwright's test() runs outside its runner.
    include: ["test/**/*.test.{ts,tsx}"],
    exclude: ["test/e2e/**", "node_modules/**"],
    pool: "threads",
    maxWorkers: 1,
    isolate: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        "**/*.config.*",
        "**/types/**",
        "prisma/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
})
