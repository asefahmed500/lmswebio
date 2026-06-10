"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { registerSchema, type RegisterFormData } from "@/lib/validators"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LMSioLogo } from "@/components/homepage/lmsio-logo"

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await registerUser(
        data.fullName,
        data.email,
        data.password
      )
      if (result.success && result.user) {
        router.push(`/${result.user.role.toLowerCase()}`)
      } else {
        setError(result.error || "Failed to create account. Please try again.")
      }
    } catch {
      setError("An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-canvas px-4 py-12">
      <div
        className={`w-full max-w-[420px] transition-all duration-500 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <LMSioLogo className="mx-auto mb-12 justify-center" variant="icon" />

        <div className="rounded-2xl border border-graphite/10 bg-chalk p-8 shadow-sq-card">
          <div className="mb-8 text-center">
            <h1 className="font-visueltpro text-2xl font-semibold tracking-tight text-void-black">
              Create an account
            </h1>
            <p className="mt-2 text-sm text-smoke">
              Start your learning journey today
            </p>
          </div>

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
                htmlFor="fullName"
                className="text-xs font-medium tracking-normal normal-case text-graphite"
              >
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                variant="filled"
                placeholder="John Doe"
                disabled={isLoading}
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium tracking-normal normal-case text-graphite"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                variant="filled"
                placeholder="you@example.com"
                disabled={isLoading}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium tracking-normal normal-case text-graphite"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                variant="filled"
                placeholder="Min. 8 characters"
                disabled={isLoading}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
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
                {...form.register("confirmPassword")}
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
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-smoke">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 transition-colors hover:text-void-black"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 transition-colors hover:text-void-black"
            >
              Privacy Policy
            </Link>
          </p>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-graphite/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-chalk px-4 text-xs text-smoke">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-smoke">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-teal hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
