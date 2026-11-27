"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  KeyRound,
  TriangleAlert,
} from "lucide-react"
import { apiPost } from "@/lib/api-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { LMSioLogo } from "@/components/homepage/lmsio-logo"

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
]

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [passwordValue, setPasswordValue] = React.useState("")

  const form = useForm({
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  if (!token) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertDescription>
          Invalid reset link. This link is missing the required token.
        </AlertDescription>
      </Alert>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col gap-5">
        <Alert>
          <CircleCheck />
          <AlertTitle>Password reset successful</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
        <Button className="w-full" asChild>
          <Link href="/login">Sign in with new password</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = async (data: {
    newPassword: string
    confirmPassword: string
  }) => {
    if (data.newPassword !== data.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiPost<{ message?: string }>(
        "/auth/reset-password",
        { token, newPassword: data.newPassword }
      )
      if (result.error) {
        setError(result.error || "Failed to reset password.")
        return
      }
      setSuccess(result.data?.message || "Password reset successfully.")
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      {error && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Enter new password"
            disabled={isLoading}
            {...form.register("newPassword", {
              required: "Password is required",
              validate: (value) => {
                if (value.length < 8)
                  return "Password must be at least 8 characters"
                if (!/[A-Z]/.test(value))
                  return "Password must contain an uppercase letter"
                if (!/[a-z]/.test(value))
                  return "Password must contain a lowercase letter"
                if (!/[0-9]/.test(value))
                  return "Password must contain a number"
                return true
              },
              onChange: (e) => setPasswordValue(e.target.value),
            })}
          />
          <FieldError errors={[form.formState.errors.newPassword]} />

          <ul className="mt-1 flex flex-col gap-2 rounded-md border border-border bg-muted p-4">
            {PASSWORD_REQUIREMENTS.map((req) => {
              const met = req.test(passwordValue)
              return (
                <li
                  key={req.label}
                  className={`flex min-w-0 items-center gap-2.5 text-xs ${met ? "text-primary" : "text-muted-foreground"}`}
                >
                  {met ? <CircleCheck /> : <CircleX />}
                  <span className="truncate">{req.label}</span>
                </li>
              )
            })}
          </ul>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            disabled={isLoading}
            {...form.register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === form.watch("newPassword") || "Passwords do not match",
            })}
          />
          <FieldError errors={[form.formState.errors.confirmPassword]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner /> : "Reset password"}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft />
          Back to sign in
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[420px]">
        <LMSioLogo className="mb-8 justify-center" variant="icon" />

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <KeyRound />
            </div>
            <CardTitle className="font-heading text-xl">
              <h1>Set new password</h1>
            </CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <ResetPasswordForm />
            </React.Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
