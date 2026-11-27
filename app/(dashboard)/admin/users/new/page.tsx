"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Spinner } from "@/components/ui/spinner"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { apiPost } from "@/lib/api-client"

export default function NewUserPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.fullName = "Full name is required"
    if (!email.trim()) errs.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email address"
    if (!password) errs.password = "Password is required"
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters"
    if (!role) errs.role = "Role is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await apiPost("/admin/users", {
        fullName,
        email,
        password,
        role,
      })

      if (!res.error) {
        toast.success("User created successfully")
        router.push("/admin/users")
      } else {
        toast.error(res.error || "Failed to create user")
      }
    } catch {
      toast.error("Failed to create user")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader
          title="Add User"
          description="Create a new platform user account"
          className="min-w-0 flex-1"
        />
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Fill in the details below to create a new user
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
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
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

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner data-icon="inline-start" />}
                {isSubmitting ? "Creating..." : "Create User"}
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
