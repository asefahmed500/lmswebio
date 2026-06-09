/**
 * New course creation page
 * Form for instructors to create a new course with Tiptap rich text editor
 */

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft, Plus } from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { courseSchema, type CourseFormData } from "@/lib/validators"
import { apiPost } from "@/lib/api-client"
import { Level } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { cn } from "@/lib/utils"

/**
 * Tiptap rich text editor component
 */
function RichTextEditor({
  content,
  onChange,
}: {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm min-h-[200px] max-w-none px-4 py-3 focus:outline-none",
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:leading-relaxed prose-p:text-muted-foreground",
          "prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground",
          "prose-strong:font-semibold prose-strong:text-foreground",
          "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
          "focus:outline-none"
        ),
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b bg-muted/50 p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "font-semibold",
            editor.isActive("bold") && "bg-accent"
          )}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("italic", editor.isActive("italic") && "bg-accent")}
        >
          Italic
        </Button>
        <div className="mx-1 h-8 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={cn(
            "text-base",
            editor.isActive("heading", { level: 1 }) && "bg-accent"
          )}
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={cn(
            "text-sm",
            editor.isActive("heading", { level: 2 }) && "bg-accent"
          )}
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={cn(
            "text-xs",
            editor.isActive("heading", { level: 3 }) && "bg-accent"
          )}
        >
          H3
        </Button>
        <div className="mx-1 h-8 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive("bulletList") && "bg-accent")}
        >
          • List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive("orderedList") && "bg-accent")}
        >
          1. List
        </Button>
        <div className="mx-1 h-8 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn(editor.isActive("paragraph") && "bg-accent")}
        >
          Paragraph
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="bg-background" />
    </div>
  )
}

/**
 * New course page component
 */
export default function NewCoursePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")

  const form = useForm({
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

  /**
   * Handle form submission
   * Creates a new course with the provided data
   */
  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiPost("/courses", {
        title: data.title,
        description: data.description,
        level: data.level,
        category: data.category || undefined,
        tags,
        thumbnail: data.thumbnail || undefined,
      })

      if (result.error) {
        throw new Error(result.error || "Failed to create course")
      }

      router.push("/instructor/courses")
    } catch (err) {
      setError("Failed to create course. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle adding a tag
   */
  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed])
      setTagInput("")
    }
  }

  /**
   * Handle removing a tag
   */
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/instructor/courses">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Course
          </h1>
          <p className="mt-1 text-muted-foreground">
            Fill in the details to create a new course
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              General information about your course
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Title */}
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

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                content={form.watch("description") || ""}
                onChange={(content) => form.setValue("description", content)}
                placeholder="Describe what students will learn in this course..."
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Level and Category */}
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

            {/* Tags */}
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
                  <Plus />
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

            {/* Thumbnail URL */}
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

        {/* Submit buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Course
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
