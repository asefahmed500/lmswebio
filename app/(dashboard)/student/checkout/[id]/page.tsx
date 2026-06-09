"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Lock, ShieldCheck, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api-client"

interface CheckoutCourse {
  id: number
  title: string
  description: string | null
  level: string
  price: number
  instructor?: { id: number; fullName: string }
  _count?: { modules: number; enrolments: number }
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const courseId = params.id as string

  const [course, setCourse] = React.useState<CheckoutCourse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = React.useState(false)
  const [demoMode, setDemoMode] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      if (!courseId || !user) return
      setIsLoading(true)
      try {
        const [courseResult, enrolResult] = await Promise.all([
          apiGet<Record<string, unknown>>(`/courses/${courseId}`),
          apiGet("/enrolments/my"),
        ])

        if (courseResult.error) {
          router.push("/student/courses/catalogue")
          return
        }

        const courseData = courseResult.data!
        setCourse(
          ((courseData as Record<string, unknown>).course as CheckoutCourse) ||
            (courseData as unknown as CheckoutCourse)
        )

        if (enrolResult.data) {
          const data = enrolResult.data
          const enrolled = Array.isArray(data)
            ? (data as { courseId: string }[]).some(
                (e) => e.courseId === courseId
              )
            : false
          if (enrolled) {
            setIsAlreadyEnrolled(true)
          }
        }

        if (
          !(courseData as Record<string, unknown>).price ||
          ((courseData as Record<string, unknown>).price as number) <= 0
        ) {
          router.push(`/student/courses/${courseId}`)
        }
      } catch {
        setError("Failed to load course details")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [courseId, user, router])

  const handleCheckout = async () => {
    setIsProcessing(true)
    setError(null)
    try {
      const result = await apiPost<{ url?: string; demoMode?: boolean }>(
        "/payments/checkout",
        { courseId }
      )

      if (result.error) {
        throw new Error(result.error)
      }

      const data = result.data!

      if (data.demoMode) {
        setDemoMode(true)
        setTimeout(() => router.push(`/student/courses/${courseId}`), 1500)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isAlreadyEnrolled) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <ShieldCheck className="text-success mx-auto mb-4 size-16" />
        <h2 className="text-2xl font-bold">Already Enrolled</h2>
        <p className="mt-2 text-muted-foreground">
          You&apos;re already enrolled in this course.
        </p>
        <Button className="mt-6" asChild>
          <Link href={`/student/courses/${courseId}`}>Go to Course</Link>
        </Button>
      </div>
    )
  }

  if (demoMode) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <div className="bg-success/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
          <ShieldCheck className="text-success size-8" />
        </div>
        <h2 className="text-2xl font-bold">Enrollment Complete!</h2>
        <p className="mt-2 text-muted-foreground">
          You have been enrolled in {course?.title}. Redirecting...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Button variant="ghost" size="icon" asChild className="w-fit">
        <Link href={`/student/courses/catalogue`}>
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Checkout</CardTitle>
          <CardDescription>
            Complete your purchase to access this course
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Course summary */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{course?.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {course?.instructor?.fullName &&
                    `By ${course.instructor.fullName}`}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">{course?.level}</Badge>
                  {course?._count?.modules != null && (
                    <Badge variant="secondary">
                      {course._count.modules} modules
                    </Badge>
                  )}
                </div>
              </div>
              <Lock className="size-5 flex-shrink-0 text-muted-foreground" />
            </div>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Course Price</span>
              <span>${course?.price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>${course?.price?.toFixed(2)}</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 size-4" />
                Pay ${course?.price?.toFixed(2)} — Enroll Now
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment powered by Stripe. Your payment info is encrypted.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
