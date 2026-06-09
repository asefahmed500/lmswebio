"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 size-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold">Authentication Error</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || "Something went wrong. Please try again."}
        </p>
        <Button onClick={reset} variant="outline">
          <RefreshCw data-icon="inline-start" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
