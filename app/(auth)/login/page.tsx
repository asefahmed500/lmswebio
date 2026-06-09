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
import { Separator } from "@/components/ui/separator"
import { LMSioLogo } from "@/components/homepage/lmsio-logo"

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
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
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent dark:from-emerald-950/20" />

      <div
        className={`relative w-full max-w-[400px] transition-all duration-500 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <LMSioLogo className="mx-auto mb-10 justify-center" variant="icon" />

        <div className="rounded-2xl border bg-card/50 p-8 shadow-xl shadow-emerald-500/[0.04] backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
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

            <div className="flex items-center gap-2">
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
                className="cursor-pointer text-sm font-normal"
              >
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign in"}
            </Button>
          </form>

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
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
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
      </div>
    </div>
  )
}
