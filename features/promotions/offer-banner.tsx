"use client"

import * as React from "react"
import Link from "next/link"
import { Tag, X } from "lucide-react"

import { apiGet } from "@/lib/api-client"
import { Button } from "@/components/ui/button"

type Offer = {
  id: string
  title: string
  discountPercent: number | null
  course: { title: string; slug: string } | null
}

/**
 * Slim, dismissible offers strip shown on every page.
 * Reads the same real promotions API as the catalogue section and renders
 * nothing when there is no active offer or the visitor dismissed it.
 */
export function OfferBanner() {
  const [offer, setOffer] = React.useState<Offer | null>(null)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    let active = true
    async function load() {
      const result = await apiGet<{ promotions: Offer[] }>("/promotions")
      if (!active || result.error) return
      const first = result.data?.promotions?.find((p) => p.course) ?? null
      setOffer(first)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  function dismiss() {
    setDismissed(true)
  }

  if (dismissed || !offer?.course) return null

  return (
    <div className="w-full border-b border-border bg-primary/[0.04]">
      <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-2 px-4 py-1.5 sm:gap-3">
        <Tag className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm">
          <span className="font-medium">{offer.title}</span>
          <span className="hidden text-muted-foreground sm:inline">
            {" — "}
            {offer.discountPercent ? `${offer.discountPercent}% off ` : ""}
            {offer.course.title}
          </span>
        </p>
        <Button asChild variant="link" size="sm" className="shrink-0">
          <Link href={`/courses/${offer.course.slug}`}>View offer</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={dismiss}
          aria-label="Dismiss offer"
          className="shrink-0"
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
