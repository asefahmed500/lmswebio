"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, UserX } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiGet, apiPut } from "@/lib/api-client"

interface UserData {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    let cancelled = false
    apiGet<UserData>(`/admin/users/${params.id}`)
      .then((res) => {
        if (!cancelled && res.data) {
          const data = res.data
          setFullName(data.fullName)
          setEmail(data.email)
          setRole(data.role)
          setIsActive(data.isActive)
        }
        if (!cancelled && res.error) {
          toast.error("User not found")
          router.push("/admin/users")
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("User not found")
          router.push("/admin/users")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [params.id, router])

  function validate() {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.fullName = "Full name is required"
    if (!email.trim()) errs.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email address"
    if (password && password.length < 6)
      errs.password = "Password must be at least 6 characters"
    if (!role) errs.role = "Role is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        fullName,
        email,
        role,
        isActive,
      }
      if (password) body.password = password

      const res = await apiPut(`/admin/users/${params.id}`, body)

      if (!res.error) {
        toast.success("User updated successfully")
        router.push("/admin/users")
      } else {
        toast.error(res.error || "Failed to update user")
      }
    } catch {
      toast.error("Failed to update user")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="mt-1 text-muted-foreground">
            Update user details and settings
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Modify the fields below to update the user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">
                New Password{" "}
                <span className="font-normal tracking-normal text-muted-foreground normal-case">
                  (leave blank to keep current)
                </span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {isActive ? "Active" : "Inactive"}
              </Label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
