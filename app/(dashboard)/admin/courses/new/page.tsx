"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Plus, Save } from "lucide-react"
import { courseSchema, type CourseFormData } from "@/lib/validators"
import { Level } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { PageHeader } from "@/features/dashboard/components/page-header"
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
import { Badge } from "@/components/ui/badge"
import { apiPost } from "@/lib/api-client"

export default function NewCoursePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      level: Level.BEGINNER,
      category: "",
      tags: [],
      thumbnail: "",
      price: "0",
    },
  })

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await apiPost("/courses", {
        title: data.title,
        description: data.description,
        level: data.level,
        category: data.category || undefined,
        tags,
        thumbnail: data.thumbnail || undefined,
        price: Number(data.price ?? 0),
      })

      if (res.error) {
        throw new Error(res.error || "Failed to create course")
      }

      router.push("/admin/courses")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Back to courses"
        >
          <Link href="/admin/courses">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader
          title="Create New Course"
          description="Add a new course to the platform"
          className="min-w-0 flex-1"
        />
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              General information about the course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <Field data-invalid={!!form.formState.errors.title}>
                <FieldLabel htmlFor="title">Course Title *</FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Web Development"
                  disabled={isLoading}
                  aria-invalid={!!form.formState.errors.title}
                  {...form.register("title")}
                />
                <FieldError>{form.formState.errors.title?.message}</FieldError>
              </Field>

              <Field data-invalid={!!form.formState.errors.description}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn..."
                  rows={6}
                  disabled={isLoading}
                  aria-invalid={!!form.formState.errors.description}
                  {...form.register("description")}
                />
                <FieldError>
                  {form.formState.errors.description?.message}
                </FieldError>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field data-invalid={!!form.formState.errors.level}>
                  <FieldLabel htmlFor="level">Difficulty Level *</FieldLabel>
                  <Select
                    value={form.watch("level")}
                    onValueChange={(value) =>
                      form.setValue("level", value as Level)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="level"
                      aria-invalid={!!form.formState.errors.level}
                    >
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>
                    {form.formState.errors.level?.message}
                  </FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Input
                    id="category"
                    placeholder="e.g., Web Development"
                    disabled={isLoading}
                    {...form.register("category")}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Tags (max 10)</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    disabled={isLoading || tags.length >= 10}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    aria-label="Add tag"
                    disabled={
                      isLoading || tags.length >= 10 || !tagInput.trim()
                    }
                  >
                    <Plus data-icon="inline-start" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove ${tag} tag`}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          disabled={isLoading}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>

              <Field data-invalid={!!form.formState.errors.thumbnail}>
                <FieldLabel htmlFor="thumbnail">Thumbnail URL</FieldLabel>
                <Input
                  id="thumbnail"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  disabled={isLoading}
                  aria-invalid={!!form.formState.errors.thumbnail}
                  {...form.register("thumbnail")}
                />
                <FieldError>
                  {form.formState.errors.thumbnail?.message}
                </FieldError>
              </Field>

              <Field data-invalid={!!form.formState.errors.price}>
                <FieldLabel htmlFor="price">Price (USD)</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isLoading}
                  aria-invalid={!!form.formState.errors.price}
                  {...form.register("price")}
                />
                <FieldError>{form.formState.errors.price?.message}</FieldError>
                <FieldDescription>
                  Leave at 0 for a free course. Paid courses use Stripe
                  Checkout.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>
              After creating the course, you can add modules and lessons from
              the course edit page.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            Create Course
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/courses")}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
