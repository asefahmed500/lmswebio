/**
 * Student Certificates Page
 * Display all earned certificates
 */

"use client"

import * as React from "react"
import { Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingCard } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { CertificateViewer } from "@/features/gamification/certificate-viewer"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import { toast } from "sonner"

interface Certificate {
  id: string
  certificateUrl: string
  verificationId: string
  issuedAt: string
  course: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
  }
  user: {
    fullName: string
    email: string
  }
}

export default function StudentCertificatesPage() {
  const { user } = useAuth()
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadCertificates() {
      if (!user) return
      setIsLoading(true)
      try {
        const result =
          await apiGet<Record<string, Certificate[]>>("/certificates")
        if (result.data) {
          setCertificates(result.data.certificates)
        }
        if (result.error) {
          toast.error("Failed to load certificates")
        }
      } catch (error) {
        console.error("Failed to load certificates:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCertificates()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="My Certificates"
          description="View and download your earned certificates"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingCard count={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="My Certificates"
        description="View and download your earned certificates"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-md bg-primary/10 p-2">
              <Award className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">
                Certificates Earned
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {certificates.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Award />
            </EmptyMedia>
            <EmptyTitle>No certificates yet</EmptyTitle>
            <EmptyDescription>
              Complete a course to earn your first certificate!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          {certificates.map((certificate) => (
            <CertificateViewer key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}
    </div>
  )
}
