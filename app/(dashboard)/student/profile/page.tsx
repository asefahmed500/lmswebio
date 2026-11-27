"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save, Lock, User } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingCard } from "@/components/loading-skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { User as UserType } from "@/types"
import { apiGet, apiPut, apiPost } from "@/lib/api-client"

interface ProfileFormData {
  fullName: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [user, setUser] = React.useState<UserType | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)

  const profileForm = useForm<ProfileFormData>({
    defaultValues: { fullName: "" },
  })

  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  React.useEffect(() => {
    async function loadUser() {
      try {
        const result = await apiGet<{ user: UserType }>("/auth/me")
        if (result.data) {
          setUser(result.data.user)
          profileForm.reset({ fullName: result.data.user.fullName })
        } else {
          router.push("/login")
        }
      } catch {
        toast.error("Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [router, profileForm])

  async function handleProfileSubmit(data: ProfileFormData) {
    if (!user) return
    setIsSaving(true)
    try {
      const result = await apiPut<{ user: UserType }>(`/users?id=${user.id}`, {
        fullName: data.fullName,
      })
      if (result.data) {
        setUser(result.data.user)
        toast.success("Profile updated successfully")
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePasswordSubmit(data: PasswordFormData) {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setIsChangingPassword(true)
    try {
      const result = await apiPost("/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      if (result.data) {
        toast.success("Password changed successfully")
        passwordForm.reset()
      } else {
        toast.error(result.error || "Failed to change password")
      }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Profile"
          description="Manage your personal information and security settings"
        />
        <div className="flex flex-col gap-6">
          <LoadingCard count={2} />
        </div>
      </div>
    )
  }

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "S"

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information and security settings"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <Avatar size="lg">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === "STUDENT" ? "Student" : user?.role}
              </p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  value={user?.email || ""}
                  readOnly
                  className="cursor-not-allowed bg-muted"
                />
                <FieldDescription>Email cannot be changed</FieldDescription>
              </Field>
              <Field
                data-invalid={
                  !!profileForm.formState.errors.fullName || undefined
                }
              >
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  aria-invalid={!!profileForm.formState.errors.fullName}
                  {...profileForm.register("fullName", {
                    required: "Full name is required",
                  })}
                />
                <FieldError>
                  {profileForm.formState.errors.fullName?.message}
                </FieldError>
              </Field>
              <Field>
                <FieldLabel>Member Since</FieldLabel>
                <Input
                  value={
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""
                  }
                  readOnly
                  className="cursor-not-allowed bg-muted"
                />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={isSaving} className="mt-6">
              {isSaving ? <Spinner /> : <Save data-icon="inline-start" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password. It must be at least 8 characters with
            uppercase, lowercase, and a number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
            <FieldGroup>
              <Field
                data-invalid={
                  !!passwordForm.formState.errors.currentPassword || undefined
                }
              >
                <FieldLabel htmlFor="currentPassword">
                  Current Password
                </FieldLabel>
                <Input
                  id="currentPassword"
                  type="password"
                  aria-invalid={!!passwordForm.formState.errors.currentPassword}
                  {...passwordForm.register("currentPassword", {
                    required: "Current password is required",
                  })}
                />
                <FieldError>
                  {passwordForm.formState.errors.currentPassword?.message}
                </FieldError>
              </Field>
              <Field
                data-invalid={
                  !!passwordForm.formState.errors.newPassword || undefined
                }
              >
                <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  aria-invalid={!!passwordForm.formState.errors.newPassword}
                  {...passwordForm.register("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <FieldError>
                  {passwordForm.formState.errors.newPassword?.message}
                </FieldError>
              </Field>
              <Field
                data-invalid={
                  !!passwordForm.formState.errors.confirmPassword || undefined
                }
              >
                <FieldLabel htmlFor="confirmPassword">
                  Confirm New Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                  {...passwordForm.register("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: (value, formValues) =>
                      value === formValues.newPassword ||
                      "Passwords do not match",
                  })}
                />
                <FieldError>
                  {passwordForm.formState.errors.confirmPassword?.message}
                </FieldError>
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="mt-6"
            >
              {isChangingPassword ? (
                <Spinner />
              ) : (
                <Lock data-icon="inline-start" />
              )}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
