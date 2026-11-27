"use client"

import * as React from "react"
import { BookOpen, FolderKanban, Plus, Hash } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { PageLoading } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { apiGet, apiPost } from "@/lib/api-client"

interface Category {
  name: string
  course_count: number
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAdding, setIsAdding] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newDescription, setNewDescription] = React.useState("")

  React.useEffect(() => {
    let cancelled = false
    apiGet<{ categories: Category[] }>("/categories")
      .then((res) => {
        if (!cancelled && res.data) setCategories(res.data.categories || [])
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load categories")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAddCategory() {
    if (!newName.trim()) {
      toast.error("Category name is required")
      return
    }
    setIsAdding(true)
    try {
      const res = await apiPost("/categories", {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      })
      if (!res.error) {
        setCategories((prev) => [
          ...prev,
          { name: newName.trim(), course_count: 0 },
        ])
        toast.success("Category added")
        setNewName("")
        setNewDescription("")
        setDialogOpen(false)
      } else {
        toast.error(res.error || "Failed to add category")
      }
    } catch {
      toast.error("Failed to add category")
    } finally {
      setIsAdding(false)
    }
  }

  const totalCourses = categories.reduce(
    (sum, cat) => sum + cat.course_count,
    0
  )

  if (isLoading) return <PageLoading label="Loading categories…" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Categories"
          description="Manage course categories and view course distribution"
          className="min-w-0 flex-1"
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new course category. Categories help organize courses
                on the platform.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4 py-4">
              <Field>
                <FieldLabel htmlFor="name">Category Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g. Web Development"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">
                  Description (optional)
                </FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Brief description of this category"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setNewName("")
                  setNewDescription("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={isAdding}>
                {isAdding ? <Spinner data-icon="inline-start" /> : null}
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="size-4" />
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {categories.length}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" />
              Courses in Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {totalCourses}
            </div>
          </CardContent>
        </Card>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban />
                </EmptyMedia>
                <EmptyTitle>No categories yet</EmptyTitle>
                <EmptyDescription>
                  Create your first category to organize courses
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus data-icon="inline-start" />
                  Add Category
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="size-4 text-primary" />
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  <span>
                    {category.course_count}{" "}
                    {category.course_count === 1 ? "course" : "courses"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
