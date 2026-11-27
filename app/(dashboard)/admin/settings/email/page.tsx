"use client"

import * as React from "react"
import { Mail, Send, Info } from "lucide-react"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { PageLoading } from "@/components/loading-skeleton"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { apiGet, apiPost, apiPut } from "@/lib/api-client"

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  secure: boolean
}

export default function AdminEmailSettingsPage() {
  const [config, setConfig] = React.useState<SmtpConfig | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isTesting, setIsTesting] = React.useState(false)
  const [testEmail, setTestEmail] = React.useState("")

  React.useEffect(() => {
    async function loadConfig() {
      try {
        const res = await apiGet<{ settings: Record<string, unknown> }>(
          "/settings"
        )
        if (res.data) {
          const s = res.data.settings
          if (s) {
            setConfig({
              host: (s.smtpHost as string) || "",
              port: (s.smtpPort as number) || 587,
              user: (s.smtpUser as string) || "",
              pass: (s.smtpPass as string) || "",
              from: (s.smtpFrom as string) || "",
              secure: (s.smtpSecure as boolean) ?? false,
            })
          }
        }
      } catch {
        toast.error("Could not load email settings")
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  function updateField(field: keyof SmtpConfig, value: string | boolean) {
    setConfig((current) => (current ? { ...current, [field]: value } : current))
  }

  async function handleSave() {
    if (!config) return
    const res = await apiPut("/settings", {
      smtpHost: config.host,
      smtpPort: Number(config.port),
      smtpUser: config.user,
      smtpPass: config.pass,
      smtpFrom: config.from,
      smtpSecure: config.secure,
    })
    if (res.error) toast.error(res.error)
    else toast.success("Email settings saved")
  }

  async function handleTestEmail() {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email address")
      return
    }
    setIsTesting(true)
    try {
      const res = await apiPost("/settings/test-email", {
        to: testEmail.trim(),
      })
      if (!res.error) {
        toast.success("Test email sent successfully")
      } else {
        toast.error(res.error || "Failed to send test email")
      }
    } catch {
      toast.error("Failed to send test email. Check server logs.")
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) return <PageLoading label="Loading settings…" />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Email Settings"
        description="Configure SMTP and email notification settings"
      />

      <Alert>
        <Info className="size-4" />
        <AlertTitle>SMTP is stored on the server</AlertTitle>
        <AlertDescription>
          Save your SMTP credentials below, then use “Send Test” to verify the
          connection. Password reset and verification emails use these values.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Stored securely on the server and used for all outgoing email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="smtpHost">SMTP Host</FieldLabel>
                <Input
                  id="smtpHost"
                  value={config?.host ?? ""}
                  placeholder="smtp.example.com"
                  onChange={(e) => updateField("host", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="smtpPort">SMTP Port</FieldLabel>
                <Input
                  id="smtpPort"
                  type="number"
                  value={config?.port?.toString() ?? ""}
                  onChange={(e) => updateField("port", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="smtpUser">SMTP Username</FieldLabel>
                <Input
                  id="smtpUser"
                  value={config?.user ?? ""}
                  onChange={(e) => updateField("user", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="smtpPass">SMTP Password</FieldLabel>
                <Input
                  id="smtpPass"
                  type="password"
                  value={config?.pass ?? ""}
                  onChange={(e) => updateField("pass", e.target.value)}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="smtpFrom">From Address</FieldLabel>
                <Input
                  id="smtpFrom"
                  type="email"
                  value={config?.from ?? ""}
                  placeholder="noreply@example.com"
                  onChange={(e) => updateField("from", e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!config}>
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-4" />
            Test Email
          </CardTitle>
          <CardDescription>
            Send a test email to verify your SMTP configuration is working
            correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="testEmail">Recipient Email</FieldLabel>
              <Input
                id="testEmail"
                type="email"
                placeholder="admin@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </Field>
            <Button
              onClick={handleTestEmail}
              disabled={isTesting || !testEmail.trim()}
            >
              {isTesting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Send data-icon="inline-start" />
              )}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-sm text-muted-foreground">
        <p>
          Email functionality depends on your SMTP provider. For production use,
          configure a reliable SMTP service like SendGrid, AWS SES, or Mailgun.
        </p>
      </div>
    </div>
  )
}
