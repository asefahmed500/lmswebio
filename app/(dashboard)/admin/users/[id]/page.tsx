"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { PageLoading } from "@/components/loading-skeleton"
import { PageHeader } from "@/features/dashboard/components/page-header"
import {
  Select,
  SelectContent,
  SelectGroup,
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

  if (isLoading) return <PageLoading label="Loading user…" />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader
          title="Edit User"
          description="Update user details and settings"
          className="min-w-0 flex-1"
        />
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
            <FieldGroup className="gap-4">
              <Field data-invalid={!!errors.fullName}>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={!!errors.fullName}
                />
                <FieldError>{errors.fullName}</FieldError>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                <FieldDescription>
                  Leave blank to keep the current password.
                </FieldDescription>
                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    id="role"
                    className="w-full"
                    aria-invalid={!!errors.role}
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                      <SelectItem value="STUDENT">Student</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{errors.role}</FieldError>
              </Field>
            </FieldGroup>

            <Field orientation="responsive" className="items-center gap-3">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <FieldLabel htmlFor="isActive" className="cursor-pointer">
                {isActive ? "Active" : "Inactive"}
              </FieldLabel>
            </Field>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner data-icon="inline-start" />}
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
