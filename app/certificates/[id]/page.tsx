"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Award, CircleCheck } from "lucide-react"
import { apiGet } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { LogoMark } from "@/components/homepage/lmsio-logo"

interface VerifiedCertificate {
  studentName: string
  courseName: string
  issuedAt: string
  verificationId: string
}

export default function VerifyCertificatePage() {
  const params = useParams()
  const id = params.id as string
  const [certificate, setCertificate] =
    React.useState<VerifiedCertificate | null>(null)
  const [status, setStatus] = React.useState<"loading" | "valid" | "invalid">(
    "loading"
  )

  React.useEffect(() => {
    async function load() {
      const result = await apiGet<{ certificate: VerifiedCertificate }>(
        `/certificates/verify?id=${encodeURIComponent(id)}`
      )
      if (result.error || !result.data?.certificate) {
        setStatus("invalid")
        return
      }
      setCertificate(result.data.certificate)
      setStatus("valid")
    }
    void load()
  }, [id])

  if (status === "loading") {
    return (
      <main
        id="main-content"
        className="flex min-h-svh items-center justify-center bg-background p-6"
      >
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Verifying certificate…
        </p>
      </main>
    )
  }

  if (status === "invalid" || !certificate) {
    return (
      <main
        id="main-content"
        className="flex min-h-svh items-center justify-center bg-background p-6"
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Award />
            </EmptyMedia>
            <EmptyTitle>Certificate not found</EmptyTitle>
            <EmptyDescription>
              Check the verification ID and try again.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link href="/">Back to LMSio</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  const issued = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center justify-center bg-background p-6"
    >
      <Card className="w-full max-w-3xl overflow-hidden">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <LogoMark className="size-8" />
              <span className="font-heading text-base font-medium">lmsio</span>
            </div>
            <Badge variant="outline" className="gap-1">
              <CircleCheck />
              Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-8 pt-10 pb-14 text-center">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Certificate of Completion
          </p>
          <h1 className="mt-6 font-heading text-3xl font-medium text-balance">
            {certificate.studentName}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            has successfully completed
          </p>
          <h2 className="mt-2 font-heading text-xl font-medium text-balance">
            {certificate.courseName}
          </h2>
          <Separator className="mx-auto mt-10 max-w-sm" />
          <p className="mt-6 text-sm text-muted-foreground">Issued {issued}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {certificate.verificationId}
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
