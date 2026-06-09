"use client"

import * as React from "react"
import {
  Mail,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { apiGet, apiPost } from "@/lib/api-client"

function MaskedValue({ value }: { value: string }) {
  const [revealed, setRevealed] = React.useState(false)

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">
        {revealed ? value : "•".repeat(Math.min(value.length, 20))}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setRevealed(!revealed)}
      >
        {revealed ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}

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
              host: (s.smtpHost as string) || "smtp.gmail.com",
              port: (s.smtpPort as number) || 587,
              user: (s.smtpUser as string) || "not-configured",
              pass: (s.smtpPass as string) || "",
              from: (s.smtpFrom as string) || "noreply@lmsplatform.com",
              secure: (s.smtpSecure as boolean) ?? false,
            })
          }
        }
      } catch {
        setConfig({
          host: "smtp.gmail.com",
          port: 587,
          user: "not-configured",
          pass: "",
          from: "noreply@lmsplatform.com",
          secure: false,
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  async function handleTestEmail() {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email address")
      return
    }
    setIsTesting(true)
    try {
      const res = await apiPost("/settings/test-email", {
        email: testEmail.trim(),
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Configure SMTP and email notification settings
        </p>
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertTitle>Environment Variables</AlertTitle>
        <AlertDescription>
          Email configuration is primarily managed through environment variables
          (<code>SMTP_HOST</code>, <code>SMTP_PORT</code>,{" "}
          <code>SMTP_USER</code>, <code>SMTP_PASS</code>). Changes should be
          made in your <code>.env</code> file and the server restarted.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Current email server settings (read-only, configured via
            environment)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>SMTP Host</Label>
              <Input value={config?.host ?? ""} readOnly />
            </div>
            <div className="flex flex-col gap-2">
              <Label>SMTP Port</Label>
              <Input value={config?.port?.toString() ?? ""} readOnly />
            </div>
            <div className="flex flex-col gap-2">
              <Label>SMTP Username</Label>
              <Input value={config?.user ?? ""} readOnly />
            </div>
            <div className="flex flex-col gap-2">
              <Label>SMTP Password</Label>
              <MaskedValue value={config?.pass ?? "••••••••"} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>From Address</Label>
              <Input value={config?.from ?? ""} readOnly />
            </div>
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
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-end gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="testEmail">Recipient Email</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="admin@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleTestEmail}
              disabled={isTesting || !testEmail.trim()}
            >
              {isTesting ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
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
