"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CircleAlert } from "lucide-react"
import { assignmentSchema, type AssignmentFormData } from "@/lib/validators"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api-client"
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
      courseId: undefined as unknown as string,
    },
  })

  React.useEffect(() => {
    async function loadCourses() {
      if (!user) return
      try {
        const res = await apiGet<{ courses: Course[] }>("/courses")
        if (res.error) throw new Error(res.error)
        setCourses(res.data!.courses)
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
      const res = await apiPost(
        "/assignments",
        data as unknown as Record<string, unknown>
      )
      if (res.error) throw new Error(res.error)
      router.push("/instructor/assignments")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create assignment"
      )
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Back to assignments"
        >
          <Link href="/instructor/assignments">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader
          className="min-w-0 flex-1"
          title="Create New Assignment"
          description="Fill in the details to create a new assignment"
        />
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Define the assignment parameters and requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Assignment Title *</FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g., Week 1: Essay on Machine Learning"
                  disabled={isSubmitting}
                  {...form.register("title")}
                />
                <FieldError errors={[form.formState.errors.title]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Describe the assignment requirements, expectations, and any resources..."
                  className="min-h-[120px]"
                  disabled={isSubmitting}
                  {...form.register("description")}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </Field>

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="courseId">Course *</FieldLabel>
                  <Select
                    value={String(form.watch("courseId") || "")}
                    onValueChange={(value) => form.setValue("courseId", value)}
                    disabled={isSubmitting || isLoadingCourses}
                  >
                    <SelectTrigger id="courseId" className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingCourses
                            ? "Loading courses..."
                            : "Select a course"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={String(course.id)}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.courseId]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="dueDate">Due Date</FieldLabel>
                  <Input
                    id="dueDate"
                    type="date"
                    disabled={isSubmitting}
                    {...form.register("dueDate")}
                  />
                  <FieldError errors={[form.formState.errors.dueDate]} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="maxPoints">Max Points *</FieldLabel>
                <Input
                  id="maxPoints"
                  type="number"
                  min={1}
                  max={1000}
                  disabled={isSubmitting}
                  {...form.register("maxPoints", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.maxPoints]} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
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
