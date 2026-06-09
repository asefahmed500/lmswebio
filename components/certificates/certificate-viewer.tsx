"use client"

import * as React from "react"
import { Download, Share2, Award, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

interface CertificateViewerProps {
  certificate: Certificate
  showActions?: boolean
}

export function CertificateViewer({
  certificate,
  showActions = true,
}: CertificateViewerProps) {
  const issueDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleDownload = () => {
    // In a real implementation, this would trigger a PDF download
    window.open(certificate.certificateUrl, "_blank")
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate of Completion - ${certificate.course.title}`,
          text: `I've successfully completed ${certificate.course.title}!`,
          url: `${window.location.origin}/certificates/verify?id=${certificate.verificationId}`,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${window.location.origin}/certificates/verify?id=${certificate.verificationId}`
      )
    }
  }

  return (
    <Card className="overflow-hidden border-2">
      <CardContent className="p-0">
        {/* Certificate Header */}
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/20">
              <Award className="size-8 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">
              Certificate of Completion
            </h2>
            <p className="text-muted-foreground">This certifies that</p>
            <h3 className="mt-2 text-xl font-semibold">
              {certificate.user.fullName}
            </h3>
            <p className="mt-2 text-muted-foreground">
              has successfully completed
            </p>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
              {certificate.course.thumbnail && (
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={certificate.course.thumbnail}
                    alt={certificate.course.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold">
                  {certificate.course.title}
                </h4>
                <Badge variant="outline" className="mt-2">
                  <CheckCircle className="mr-1 size-3" />
                  Completed
                </Badge>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Issue Date</p>
                <p className="font-medium">{issueDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Certificate ID</p>
                <p className="font-mono text-xs font-medium">
                  {certificate.verificationId}
                </p>
              </div>
            </div>

            {/* Verification Link */}
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Verify this certificate at
              </p>
              <a
                href={`${window.location.origin}/certificates/verify?id=${certificate.verificationId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm break-all text-primary hover:underline"
              >
                {`${window.location.origin}/certificates/verify?id=${certificate.verificationId}`}
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="border-t bg-muted/30 p-4">
            <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
              <Button onClick={handleDownload} className="gap-2">
                <Download data-icon="inline-start" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 data-icon="inline-start" />
                Share
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
