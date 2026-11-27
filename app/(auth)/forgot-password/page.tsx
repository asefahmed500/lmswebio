"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { ArrowLeft, CircleCheck, Mail, TriangleAlert } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"
import { LMSioLogo } from "@/components/homepage/lmsio-logo"

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const form = useForm<ForgotPasswordFormData>({ defaultValues: { email: "" } })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await apiPost<{ message?: string }>(
        "/auth/forgot-password",
        { email: data.email }
      )
      if (result.error) {
        setError(result.error || "Something went wrong. Please try again.")
        return
      }
      setSuccess(
        result.data?.message ||
          "If an account exists, a reset link has been sent."
      )
      form.reset()
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[420px]">
        <LMSioLogo className="mb-8 justify-center" variant="icon" />

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Mail />
            </div>
            <CardTitle className="font-heading text-xl">
              <h1>Forgot password?</h1>
            </CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col gap-5">
                <Alert>
                  <CircleCheck />
                  <AlertTitle>Check your email</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
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
                    <FieldLabel htmlFor="email">Email address</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      {...form.register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    <FieldError errors={[form.formState.errors.email]} />
                  </Field>
                </FieldGroup>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner /> : "Send reset link"}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
