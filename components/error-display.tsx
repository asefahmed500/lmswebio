"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  showHome?: boolean
}

export function ErrorDisplay({
  title = "Something went wrong",
  message,
  onRetry,
  showHome = false,
}: ErrorDisplayProps) {
  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {showHome && (
            <Button asChild>
              <a href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
