"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { loginSchema, type LoginFormData } from "@/lib/validators"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { LMSioLogo } from "@/components/homepage/lmsio-logo"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await login(data.email, data.password)
      if (result.success && result.user) {
        router.push(`/${result.user.role.toLowerCase()}`)
      } else {
        setError(result.error || "Invalid email or password")
      }
    } catch {
      setError("An error occurred during login")
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
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-smoke">
              Sign in to continue learning
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
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium tracking-normal normal-case text-graphite"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-teal transition-colors hover:text-brand-teal/80"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                variant="filled"
                placeholder="Enter your password"
                disabled={isLoading}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="remember"
                checked={form.watch("remember")}
                onCheckedChange={(checked) =>
                  form.setValue("remember", checked as boolean)
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="remember"
                className="cursor-pointer text-sm font-normal tracking-normal normal-case text-graphite"
              >
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-1 h-12 w-full rounded-lg tracking-wide"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-graphite/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-chalk px-4 text-xs text-smoke">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-smoke">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-brand-teal hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-smoke">
          By signing in, you agree to our{" "}
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
      </div>
    </div>
  )
}
