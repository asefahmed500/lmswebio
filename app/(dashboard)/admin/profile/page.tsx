"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Lock, User } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { apiPut, apiPost } from "@/lib/api-client"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { User as UserType } from "@/types"

interface ProfileFormData {
  fullName: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function AdminProfilePage() {
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
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          profileForm.reset({ fullName: data.user.fullName })
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-primary" />
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
    : "A"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your personal information and security settings
        </p>
      </div>

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
                {user?.role === "ADMIN" ? "Administrator" : user?.role}
              </p>
            </div>
          </div>

          <form
            onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                readOnly
                className="cursor-not-allowed bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...profileForm.register("fullName", {
                  required: "Full name is required",
                })}
              />
              {profileForm.formState.errors.fullName && (
                <p className="text-sm text-destructive">
                  {profileForm.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Member Since</Label>
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
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Save data-icon="inline-start" />
              )}
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
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register("currentPassword", {
                  required: "Current password is required",
                })}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New Password</Label>
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
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
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
