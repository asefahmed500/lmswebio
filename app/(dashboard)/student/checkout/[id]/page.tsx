"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CircleAlert,
  Lock,
  ShieldCheck,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingCourseCard } from "@/components/loading-skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
  id: string
  title: string
  description: string | null
  level: string
  price: number
  instructor?: { id: string; fullName: string }
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
          apiGet<{ course: CheckoutCourse }>(`/courses/public/${courseId}`),
          apiGet("/enrolments/my"),
        ])

        if (courseResult.error || !courseResult.data) {
          router.push("/student/courses/catalogue")
          return
        }

        const loadedCourse = courseResult.data.course
        setCourse(loadedCourse)

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

        if (!loadedCourse.price || loadedCourse.price <= 0) {
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
      <div className="mx-auto flex max-w-2xl min-w-0 flex-col gap-6 p-6">
        <LoadingCourseCard />
      </div>
    )
  }

  if (isAlreadyEnrolled) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldCheck />
          </EmptyMedia>
          <EmptyTitle>Already Enrolled</EmptyTitle>
          <EmptyDescription>
            You&apos;re already enrolled in this course.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={`/student/courses/${courseId}`}>Go to Course</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (demoMode) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldCheck />
          </EmptyMedia>
          <EmptyTitle>Enrollment Complete!</EmptyTitle>
          <EmptyDescription>
            You have been enrolled in {course?.title}. Redirecting...
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl min-w-0 flex-col gap-6 p-6">
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="self-start"
        aria-label="Back to catalogue"
      >
        <Link href={`/student/courses/catalogue`}>
          <ArrowLeft />
        </Link>
      </Button>

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
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
              <Lock className="size-5 shrink-0 text-muted-foreground" />
            </div>
          </div>

          {/* Price breakdown */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Course Price</span>
              <span>${course?.price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>$0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between pt-1 text-lg font-semibold">
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
              <Spinner />
            ) : (
              <CreditCard data-icon="inline-start" />
            )}
            {isProcessing
              ? "Processing..."
              : `Pay $${course?.price?.toFixed(2)} — Enroll Now`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment powered by Stripe. Your payment info is encrypted.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
