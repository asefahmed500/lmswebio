"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  KeyRound,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
          <CheckCircle2 className="size-4 text-emerald-500" />
          <AlertDescription>
            <p className="font-medium text-void-black">
              Password reset successful
            </p>
            <p className="mt-1 text-sm text-smoke">{success}</p>
          </AlertDescription>
        </Alert>
        <Button size="lg" className="h-12 w-full rounded-lg tracking-wide" asChild>
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: data.newPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Failed to reset password.")
        return
      }
      setSuccess(json.message || "Password reset successfully.")
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
        <Alert
          variant="destructive"
          className="animate-in fade-in-0 slide-in-from-top-2"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="newPassword"
          className="text-xs font-medium tracking-normal normal-case text-graphite"
        >
          New Password
        </Label>
        <Input
          id="newPassword"
          type="password"
          variant="filled"
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
              if (!/[0-9]/.test(value)) return "Password must contain a number"
              return true
            },
            onChange: (e) => setPasswordValue(e.target.value),
          })}
        />
        {form.formState.errors.newPassword && (
          <p className="text-xs text-destructive">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-graphite/10 bg-linen p-4">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(passwordValue)
          return (
            <div
              key={req.label}
              className={`flex items-center gap-2.5 text-xs ${met ? "text-emerald-600" : "text-smoke"}`}
            >
              {met ? (
                <CheckCircle2 className="size-3.5 shrink-0" />
              ) : (
                <XCircle className="size-3.5 shrink-0" />
              )}
              {req.label}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="confirmPassword"
          className="text-xs font-medium tracking-normal normal-case text-graphite"
        >
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          variant="filled"
          placeholder="Repeat your password"
          disabled={isLoading}
          {...form.register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) =>
              value === form.watch("newPassword") || "Passwords do not match",
          })}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-1 h-12 w-full rounded-lg tracking-wide"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "Reset password"}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-smoke transition-colors hover:text-void-black"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-canvas px-4 py-12">
      <div
        className={`w-full max-w-[420px] transition-all duration-500 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <LMSioLogo className="mx-auto mb-12 justify-center" variant="icon" />

        <div className="rounded-2xl border border-graphite/10 bg-chalk p-8 shadow-sq-card">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-linen">
              <KeyRound className="size-6 text-graphite" />
            </div>
            <h1 className="font-visueltpro text-2xl font-semibold tracking-tight text-void-black">
              Set new password
            </h1>
            <p className="mt-2 text-sm text-smoke">
              Enter your new password below
            </p>
          </div>

          <React.Suspense fallback={<div className="h-8" />}>
            <ResetPasswordForm />
          </React.Suspense>
        </div>
      </div>
    </div>
  )
}
