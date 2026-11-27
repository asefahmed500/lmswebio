import type { Page } from "@playwright/test"

export interface BrowserLog {
  consoleErrors: string[]
  pageErrors: string[]
  failedRequests: string[]
  serverErrors: string[]
}

export function watchConsole(page: Page): BrowserLog {
  const log: BrowserLog = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    serverErrors: [],
  }

  page.on("console", (message) => {
    if (message.type() === "error") {
      log.consoleErrors.push(`${message.text()} @ ${message.location().url}`)
    }
  })
  page.on("pageerror", (error) => log.pageErrors.push(error.message))
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown"
    if (!/ERR_ABORTED|net::ERR_ABORTED/.test(failure)) {
      log.failedRequests.push(
        `${request.method()} ${request.url()} — ${failure}`
      )
    }
  })
  page.on("response", (response) => {
    if (response.status() >= 500) {
      log.serverErrors.push(`${response.status()} ${response.url()}`)
    }
  })

  return log
}

export function cleanLog(log: BrowserLog): string[] {
  return [
    ...log.pageErrors.map((e) => `pageerror: ${e}`),
    ...log.serverErrors.map((e) => `server: ${e}`),
    ...log.consoleErrors.filter(
      (e) => !/favicon|Failed to load resource.*404/.test(e)
    ),
  ]
}
