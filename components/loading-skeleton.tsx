"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { LogoMark } from "@/components/homepage/lmsio-logo"

/**
 * One loading vocabulary for the whole product.
 *
 * Skeletons mirror the geometry of the content they replace — 36px controls,
 * 24px titles, the same card padding and the same gaps — so a page settles
 * without shifting. No custom keyframes or spinning containers: everything is
 * built from the shadcn Skeleton primitive and the shared Spinner.
 */

function Lines({
  widths,
  className,
}: {
  widths: string[]
  className?: string
}) {
  return (
    <div className={className ?? "flex flex-col gap-2"}>
      {widths.map((width, index) => (
        <Skeleton key={index} className={`h-3.5 ${width}`} />
      ))}
    </div>
  )
}

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <LogoMark className="size-10" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>{label}</span>
      </div>
    </div>
  )
}

export function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[420px] py-0">
        <CardHeader className="items-center gap-2 text-center">
          <LogoMark className="size-8" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3.5 w-52" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
        <CardFooter className="justify-center">
          <Skeleton className="h-3.5 w-48" />
        </CardFooter>
      </Card>
    </div>
  )
}

export function DashboardLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="gap-2">
            <CardHeader className="gap-1">
              <Skeleton className="h-3.5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-2">
        <CardHeader className="gap-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-56 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}

export function LoadingCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="gap-2">
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-28 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}

export function LoadingCourseCard() {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Lines widths={["w-4/5", "w-3/5"]} />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

export function CourseGridLoading({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCourseCard key={index} />
      ))}
    </div>
  )
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-0 items-center gap-4 rounded-md border border-border bg-card p-4"
        >
          <Skeleton className="size-9 shrink-0 rounded-md" />
          <Skeleton className="h-3.5 w-1/4 min-w-16" />
          <Skeleton className="h-3.5 w-1/3 min-w-16 max-sm:hidden" />
          <Skeleton className="h-3.5 w-1/5 min-w-12 max-md:hidden" />
          <Skeleton className="ml-auto h-9 w-20 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function DetailLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Lines widths={["w-64", "w-96"]} className="flex flex-col gap-2" />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="gap-2">
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="aspect-video w-full rounded-md" />
            <Lines widths={["w-3/4", "w-full", "w-5/6"]} />
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-3.5 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
