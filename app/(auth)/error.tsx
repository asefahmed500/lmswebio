"use client"

import { useEffect } from "react"
import { RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

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
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="text-destructive">
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>Authentication Error</EmptyTitle>
          <EmptyDescription>
            {error.message || "Something went wrong. Please try again."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset} variant="outline">
            <RefreshCw data-icon="inline-start" />
            Try Again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
