/**
 * Student Certificates Page
 * Display all earned certificates
 */

"use client"

import * as React from "react"
import { Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CertificateViewer } from "@/components/certificates/certificate-viewer"
import { LoadingCard } from "@/components/loading-skeleton"
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
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="mt-1 text-muted-foreground">
            View and download your earned certificates
          </p>
        </div>
        <LoadingCard count={3} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
        <p className="mt-1 text-muted-foreground">
          View and download your earned certificates
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">
                Certificates Earned
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {certificates.length === 0 ? (
        <div className="py-12 text-center">
          <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No certificates yet</h3>
          <p className="mb-4 text-muted-foreground">
            Complete a course to earn your first certificate!
          </p>
        </div>
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
