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
import { Separator } from "@/components/ui/separator"
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
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 via-transparent to-transparent dark:from-teal-950/20" />

      <div
        className={`relative w-full max-w-[400px] transition-all duration-500 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <LMSioLogo className="mx-auto mb-10 justify-center" variant="icon" />

        <div className="rounded-2xl border bg-card/50 p-8 shadow-xl shadow-teal-500/[0.04] backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start your learning journey
            </p>
          </div>

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
              <Label htmlFor="fullName" className="text-xs font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                disabled={isLoading}
                className="h-11 rounded-xl"
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

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
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                disabled={isLoading}
                className="h-11 rounded-xl"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                disabled={isLoading}
                className="h-11 rounded-xl"
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
              className="h-11 w-full rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </p>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
