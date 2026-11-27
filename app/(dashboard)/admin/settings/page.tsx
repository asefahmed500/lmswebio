"use client"

import * as React from "react"
import { Settings, Moon, Sun, Save } from "lucide-react"
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { PageLoading } from "@/components/loading-skeleton"
import { PageHeader } from "@/features/dashboard/components/page-header"
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
    } catch (_error) {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageLoading label="Loading settings…" />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Configure platform settings and preferences"
      />

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
        <CardContent>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="systemName">Site Name</FieldLabel>
              <Input
                id="systemName"
                placeholder="LMS Platform"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="max-w-md"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="systemDescription">
                Site Description
              </FieldLabel>
              <Input
                id="systemDescription"
                placeholder="Learning Management System"
                value={systemDescription}
                onChange={(e) => setSystemDescription(e.target.value)}
                className="max-w-md"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="maxUploadSize">
                Max Upload Size (MB)
              </FieldLabel>
              <Input
                id="maxUploadSize"
                type="number"
                min={1}
                max={100}
                value={maxUploadSize}
                onChange={(e) => setMaxUploadSize(Number(e.target.value))}
                className="max-w-md"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field orientation="responsive" className="items-center">
              <FieldContent>
                <FieldLabel htmlFor="allowRegistration">
                  Allow Registration
                </FieldLabel>
                <FieldDescription>
                  Allow new users to register on the platform
                </FieldDescription>
              </FieldContent>
              <Switch
                id="allowRegistration"
                checked={allowRegistration}
                onCheckedChange={setAllowRegistration}
              />
            </Field>
            <Field orientation="responsive" className="items-center">
              <FieldContent>
                <FieldLabel htmlFor="emailNotifications">
                  Email Notifications
                </FieldLabel>
                <FieldDescription>
                  Send email notifications for important events
                </FieldDescription>
              </FieldContent>
              <Switch
                id="emailNotifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </Field>
            <Field orientation="responsive" className="items-center">
              <FieldContent>
                <FieldLabel htmlFor="maintenanceMode">
                  Maintenance Mode
                </FieldLabel>
                <FieldDescription>
                  Temporarily disable access for non-admin users
                </FieldDescription>
              </FieldContent>
              <Switch
                id="maintenanceMode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </Field>
          </FieldGroup>
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
          <Field orientation="responsive" className="items-center gap-3">
            <Switch
              id="darkMode"
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
            <FieldLabel htmlFor="darkMode">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </FieldLabel>
          </Field>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
