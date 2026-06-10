"use client"

import * as React from "react"
import { BookOpen, FolderKanban, Plus, Loader2, Hash } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-muted-foreground">
            Manage course categories and view course distribution
          </p>
        </div>
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
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Web Development"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this category"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
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
                {isAdding ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
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
            <div className="text-3xl font-bold">{categories.length}</div>
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
            <div className="text-3xl font-bold">{totalCourses}</div>
          </CardContent>
        </Card>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first category to organize courses
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus data-icon="inline-start" />
              Add Category
            </Button>
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
