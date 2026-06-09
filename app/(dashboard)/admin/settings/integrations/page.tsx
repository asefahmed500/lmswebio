"use client"

import * as React from "react"
import {
  Puzzle,
  Video,
  MessageSquare,
  Cloud,
  CreditCard,
  FileText,
  BarChart3,
  Users,
  Bell,
  Globe,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: string
  enabled: boolean
  comingSoon: boolean
}

const defaultIntegrations: Integration[] = [
  {
    id: "zoom",
    name: "Zoom",
    description:
      "Schedule and host live video classes directly from the platform",
    icon: Video,
    category: "Video Conferencing",
    enabled: false,
    comingSoon: false,
  },
  {
    id: "google-meet",
    name: "Google Meet",
    description: "Integrate Google Meet for online classroom sessions",
    icon: Video,
    category: "Video Conferencing",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications and updates to Slack channels",
    icon: MessageSquare,
    category: "Communication",
    enabled: false,
    comingSoon: false,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Connect your Discord server for community engagement",
    icon: MessageSquare,
    category: "Communication",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Process payments and manage subscriptions securely",
    icon: CreditCard,
    category: "Payments",
    enabled: false,
    comingSoon: false,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Accept payments via PayPal checkout",
    icon: CreditCard,
    category: "Payments",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Store and stream course media files from Google Drive",
    icon: Cloud,
    category: "Storage",
    enabled: false,
    comingSoon: false,
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "Use Amazon S3 for scalable media storage",
    icon: Cloud,
    category: "Storage",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track platform usage and user behavior",
    icon: BarChart3,
    category: "Analytics",
    enabled: false,
    comingSoon: false,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Sync users and send marketing email campaigns",
    icon: Mail,
    category: "Marketing",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Let students book 1-on-1 sessions with instructors",
    icon: Users,
    category: "Scheduling",
    enabled: false,
    comingSoon: true,
  },
  {
    id: "pusher",
    name: "Pusher",
    description: "Real-time notifications and live updates",
    icon: Bell,
    category: "Infrastructure",
    enabled: false,
    comingSoon: false,
  },
]

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = React.useState(defaultIntegrations)

  function handleToggle(id: string) {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id ? { ...int, enabled: !int.enabled } : int
      )
    )
    const integration = integrations.find((i) => i.id === id)
    if (integration) {
      toast.success(
        `${integration.name} ${integration.enabled ? "disabled" : "enabled"}`
      )
    }
  }

  const activeCount = integrations.filter((i) => i.enabled).length

  const grouped = integrations.reduce<Record<string, Integration[]>>(
    (acc, int) => {
      if (!acc[int.category]) acc[int.category] = []
      acc[int.category].push(int)
      return acc
    },
    {}
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Integrations configuration is coming soon. This page is a placeholder
        preview.
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect third-party services to extend platform capabilities
        </p>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="size-4" />
            Active Integrations
          </CardTitle>
          <CardDescription>
            {activeCount} of {integrations.length} integrations enabled
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{category}</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((integration) => (
              <Card
                key={integration.id}
                className={
                  integration.comingSoon
                    ? "opacity-60"
                    : integration.enabled
                      ? "border-primary/50"
                      : ""
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <integration.icon className="size-5 text-primary" />
                    </div>
                    {integration.comingSoon && (
                      <Badge variant="outline" className="text-[10px]">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-3 text-base">
                    {integration.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleToggle(integration.id)}
                      disabled={integration.comingSoon}
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
