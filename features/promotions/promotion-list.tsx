"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Tag } from "lucide-react"

import { apiGet } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingCard } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type Promotion = {
  id: string
  title: string
  description: string
  badge: string | null
  discountPercent: number | null
  course: {
    id: string
    title: string
    slug: string
    price: number | null
    category: string | null
    instructor: { fullName: string }
  } | null
}

export function PromotionList() {
  const [promotions, setPromotions] = React.useState<Promotion[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    async function load() {
      const result = await apiGet<{ promotions: Promotion[] }>("/promotions")
      if (!active) return
      if (result.error) setError(result.error)
      else setPromotions(result.data?.promotions ?? [])
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <section aria-label="Special offers" className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingCard count={3} />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (promotions.length === 0) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Tag />
          </EmptyMedia>
          <EmptyTitle>No offers right now</EmptyTitle>
          <EmptyDescription>
            Check back soon — new offers are added when courses go on sale.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href="/courses">Browse all courses</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <section aria-labelledby="offers-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="offers-heading" className="text-lg font-medium tracking-tight">
          Special offers
        </h2>
        <p className="text-sm text-muted-foreground">
          Limited-time reductions on real courses.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promotion) => {
          const course = promotion.course
          const originalPrice = course?.price ?? 0
          const discountedPrice =
            promotion.discountPercent && originalPrice > 0
              ? Number(
                  (
                    originalPrice *
                    (1 - promotion.discountPercent / 100)
                  ).toFixed(2)
                )
              : null

          return (
            <Card key={promotion.id} className="min-w-0 py-0">
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {promotion.badge ? (
                    <Badge variant="secondary">{promotion.badge}</Badge>
                  ) : null}
                  {promotion.discountPercent ? (
                    <Badge variant="success">
                      {promotion.discountPercent}% off
                    </Badge>
                  ) : null}
                </div>
                <CardTitle className="truncate">{promotion.title}</CardTitle>
                <CardDescription>{promotion.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex min-w-0 flex-col gap-1">
                {course ? (
                  <>
                    <p className="truncate text-sm font-medium">
                      {course.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {course.instructor.fullName}
                      {course.category ? ` · ${course.category}` : ""}
                    </p>
                    {discountedPrice !== null ? (
                      <p className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          ${discountedPrice}
                        </span>
                        <span className="text-muted-foreground line-through">
                          ${originalPrice}
                        </span>
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This offer is no longer available.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  size="sm"
                  variant={course ? "default" : "outline"}
                  disabled={!course}
                  className="w-full"
                >
                  {course ? (
                    <Link href={`/courses/${course.slug}`}>
                      View course
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  ) : (
                    <span>Unavailable</span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
