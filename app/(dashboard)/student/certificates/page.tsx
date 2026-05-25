/**
 * Student Certificates Page
 * Display all earned certificates
 */

"use client"

import * as React from "react"
import { Award, Download, Share2 } from "lucide-react"
import { CertificateViewer } from "@/components/certificates/certificate-viewer"
import { LoadingCard } from "@/components/loading-skeleton"

interface Certificate {
  id: number
  certificateUrl: string
  verificationId: string
  issuedAt: string
  course: {
    id: number
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
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadCertificates() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/certificates")
        if (response.ok) {
          const data = await response.json()
          setCertificates(data.certificates)
        }
      } catch (error) {
        console.error("Failed to load certificates:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCertificates()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
        <p className="mt-1 text-muted-foreground">
          View and download your earned certificates
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 p-6 border rounded-lg">
          <div className="p-3 bg-primary/10 rounded-full">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{certificates.length}</p>
            <p className="text-sm text-muted-foreground">Certificates Earned</p>
          </div>
        </div>
      </div>

      {/* Certificates */}
      {certificates.length === 0 ? (
        <div className="text-center py-12">
          <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
          <p className="text-muted-foreground mb-4">
            Complete a course to earn your first certificate!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {certificates.map((certificate) => (
            <CertificateViewer key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}
    </div>
  )
}
