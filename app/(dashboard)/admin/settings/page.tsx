"use client"

import * as React from "react"
import { Settings, Moon, Sun, Save, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
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
import { Separator } from "@/components/ui/separator"
import { apiGet, apiPut } from "@/lib/api-client"

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme()
  const [systemName, setSystemName] = React.useState("")
  const [systemDescription, setSystemDescription] = React.useState("")
  const [allowRegistration, setAllowRegistration] = React.useState(true)
  const [maintenanceMode, setMaintenanceMode] = React.useState(false)
  const [emailNotifications, setEmailNotifications] = React.useState(true)
  const [maxUploadSize, setMaxUploadSize] = React.useState(20)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiGet<{ settings: Record<string, unknown> }>(
          "/settings"
        )
        if (res.data) {
          const s = res.data.settings
          setSystemName((s.siteName as string) || "")
          setSystemDescription((s.siteDescription as string) || "")
          setAllowRegistration((s.allowRegistration as boolean) ?? true)
          setMaintenanceMode((s.maintenanceMode as boolean) ?? false)
          setEmailNotifications((s.emailNotifications as boolean) ?? true)
          setMaxUploadSize((s.maxUploadSize as number) ?? 20)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await apiPut("/settings", {
        siteName: systemName,
        siteDescription: systemDescription,
        allowRegistration,
        maintenanceMode,
        emailNotifications,
        maxUploadSize,
      })

      if (!res.error) {
        toast.success("Settings saved successfully")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure platform settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic platform configuration options
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="systemName">Site Name</Label>
            <Input
              id="systemName"
              placeholder="LMS Platform"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="systemDescription">Site Description</Label>
            <Input
              id="systemDescription"
              placeholder="Learning Management System"
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
            <Input
              id="maxUploadSize"
              type="number"
              min={1}
              max={100}
              value={maxUploadSize}
              onChange={(e) => setMaxUploadSize(Number(e.target.value))}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowRegistration" className="cursor-pointer">
                Allow Registration
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register on the platform
              </p>
            </div>
            <Switch
              id="allowRegistration"
              checked={allowRegistration}
              onCheckedChange={setAllowRegistration}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications" className="cursor-pointer">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for important events
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenanceMode" className="cursor-pointer">
                Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable access for non-admin users
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            Theme
          </CardTitle>
          <CardDescription>Toggle between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="darkMode"
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
            <Label htmlFor="darkMode" className="cursor-pointer">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
