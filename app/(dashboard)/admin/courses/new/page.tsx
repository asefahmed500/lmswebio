"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft, Plus, Save } from "lucide-react"
import { courseSchema, type CourseFormData } from "@/lib/validators"
import { Level } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Course
          </h1>
          <p className="mt-1 text-muted-foreground">
            Add a new course to the platform
          </p>
        </div>
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
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Web Development"
                disabled={isLoading}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn..."
                rows={6}
                disabled={isLoading}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="level">Difficulty Level *</Label>
                <Select
                  value={form.watch("level")}
                  onValueChange={(value) =>
                    form.setValue("level", value as Level)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.level && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.level.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Web Development"
                  disabled={isLoading}
                  {...form.register("category")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tags (max 10)</Label>
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
                  disabled={isLoading || tags.length >= 10 || !tagInput.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTag(tag)}
                        className="size-5 rounded-full p-0.5 hover:bg-destructive/20"
                        disabled={isLoading}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                type="url"
                placeholder="https://example.com/image.jpg"
                disabled={isLoading}
                {...form.register("thumbnail")}
              />
              {form.formState.errors.thumbnail && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.thumbnail.message}
                </p>
              )}
            </div>
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
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 size-4" />
            Create Course
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
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
