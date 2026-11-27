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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
import { apiGet, apiPut, apiPost } from "@/lib/api-client"
import type { User as UserType } from "@/types"

interface ProfileFormData {
  fullName: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function InstructorProfilePage() {
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
        if (!result.error && result.data) {
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
      if (!result.error && result.data) {
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
      if (!result.error) {
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

  const header = (
    <PageHeader
      title="Profile"
      description="Manage your personal information and security settings"
    />
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {header}
        <LoadingCard />
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
    : "I"

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {header}

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
                {user?.role === "INSTRUCTOR" ? "Instructor" : user?.role}
              </p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <FieldGroup className="gap-4">
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
              <Field>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  {...profileForm.register("fullName", {
                    required: "Full name is required",
                  })}
                />
                <FieldError errors={[profileForm.formState.errors.fullName]} />
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
              <Field>
                <Button type="submit" disabled={isSaving} className="w-fit">
                  {isSaving ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  Save Changes
                </Button>
              </Field>
            </FieldGroup>
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
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="currentPassword">
                  Current Password
                </FieldLabel>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register("currentPassword", {
                    required: "Current password is required",
                  })}
                />
                <FieldError
                  errors={[passwordForm.formState.errors.currentPassword]}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <FieldError
                  errors={[passwordForm.formState.errors.newPassword]}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm New Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: (value, formValues) =>
                      value === formValues.newPassword ||
                      "Passwords do not match",
                  })}
                />
                <FieldError
                  errors={[passwordForm.formState.errors.confirmPassword]}
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-fit"
                >
                  {isChangingPassword ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <Lock data-icon="inline-start" />
                  )}
                  Change Password
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
