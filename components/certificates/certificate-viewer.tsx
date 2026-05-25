"use client"

import * as React from "react"
import { Download, Share2, Award, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8 border-b">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
            <p className="text-muted-foreground">
              This certifies that
            </p>
            <h3 className="text-xl font-semibold mt-2">
              {certificate.user.fullName}
            </h3>
            <p className="text-muted-foreground mt-2">
              has successfully completed
            </p>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              {certificate.course.thumbnail && (
                <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={certificate.course.thumbnail}
                    alt={certificate.course.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold">{certificate.course.title}</h4>
                <Badge variant="outline" className="mt-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-muted-foreground">Issue Date</p>
                <p className="font-medium">{issueDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Certificate ID</p>
                <p className="font-medium font-mono text-xs">
                  {certificate.verificationId}
                </p>
              </div>
            </div>

            {/* Verification Link */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Verify this certificate at
              </p>
              <a
                href={`${window.location.origin}/certificates/verify?id=${certificate.verificationId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-primary hover:underline break-all"
              >
                {`${window.location.origin}/certificates/verify?id=${certificate.verificationId}`}
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="bg-muted/30 p-4 border-t">
            <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
