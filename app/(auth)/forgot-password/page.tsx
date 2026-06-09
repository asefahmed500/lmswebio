"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LMSioLogo } from "@/components/homepage/lmsio-logo"

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const form = useForm<ForgotPasswordFormData>({ defaultValues: { email: "" } })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.")
        return
      }
      setSuccess(
        json.message || "If an account exists, a reset link has been sent."
      )
      form.reset()
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/30 via-transparent to-transparent dark:from-amber-950/10" />

      <div
        className={`relative w-full max-w-[400px] transition-all duration-500 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <LMSioLogo className="mx-auto mb-10 justify-center" variant="icon" />

        <div className="rounded-2xl border bg-card/50 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950">
              <Mail className="size-5 text-amber-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Forgot password?
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="size-4 text-emerald-500" />
                <AlertDescription>
                  <p className="font-medium">Check your email</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {success}
                  </p>
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl"
                asChild
              >
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-in fade-in-0 slide-in-from-top-2"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  className="h-11 rounded-xl"
                  {...form.register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  })}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
