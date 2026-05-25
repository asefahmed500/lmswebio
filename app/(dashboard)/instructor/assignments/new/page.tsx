/**
 * New assignment creation page
 * Form for instructors to create a new assignment for one of their courses
 */

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft } from "lucide-react"
import { assignmentSchema, type AssignmentFormData } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import type { Course } from "@/types"

export default function NewAssignmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      maxPoints: 100,
      courseId: undefined as unknown as number,
    },
  })

  React.useEffect(() => {
    async function loadCourses() {
      if (!user) return
      try {
        const res = await fetch("/api/courses")
        if (!res.ok) throw new Error("Failed to fetch courses")
        const data = await res.json()
        setCourses(data)
      } catch (err) {
        console.error("Failed to load courses:", err)
      } finally {
        setIsLoadingCourses(false)
      }
    }
    loadCourses()
  }, [user])

  const onSubmit = async (data: AssignmentFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create assignment")
      }
      router.push("/instructor/assignments")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/instructor/assignments">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Assignment
          </h1>
          <p className="mt-1 text-muted-foreground">
            Fill in the details to create a new assignment
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Define the assignment parameters and requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Week 1: Essay on Machine Learning"
                disabled={isSubmitting}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the assignment requirements, expectations, and any resources..."
                className="min-h-[120px]"
                disabled={isSubmitting}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course *</Label>
                <Select
                  value={String(form.watch("courseId") || "")}
                  onValueChange={(value) =>
                    form.setValue("courseId", Number(value))
                  }
                  disabled={isSubmitting || isLoadingCourses}
                >
                  <SelectTrigger id="courseId">
                    <SelectValue
                      placeholder={
                        isLoadingCourses ? "Loading courses..." : "Select a course"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.courseId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.courseId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  disabled={isSubmitting}
                  {...form.register("dueDate")}
                />
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPoints">Max Points *</Label>
              <Input
                id="maxPoints"
                type="number"
                min={1}
                max={1000}
                disabled={isSubmitting}
                {...form.register("maxPoints", { valueAsNumber: true })}
              />
              {form.formState.errors.maxPoints && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.maxPoints.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Assignment
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
