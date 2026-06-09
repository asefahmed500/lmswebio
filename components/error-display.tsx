"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  showHome?: boolean
  homeHref?: string
}

export function ErrorDisplay({
  title = "Something went wrong",
  message,
  onRetry,
  showHome = false,
  homeHref = "/admin",
}: ErrorDisplayProps) {
  return (
    <Card className="mx-auto my-8 max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 size-4" />
              Try Again
            </Button>
          )}
          {showHome && (
            <Button asChild>
              <Link href={homeHref}>
                <Home className="mr-2 size-4" />
                Go to Dashboard
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
