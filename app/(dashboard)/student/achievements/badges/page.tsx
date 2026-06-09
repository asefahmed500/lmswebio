"use client"

import * as React from "react"
import { Award, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import { toast } from "sonner"
import { BadgeDisplay } from "@/components/badges/badge-display"
import Link from "next/link"

interface BadgeItem {
  id: string
  name: string
  slug: string
  description: string
  iconUrl: string | null
  points: number
  earned: boolean
  earnedAt: Date | null
}

export default function BadgesPage() {
  const { user } = useAuth()
  const [badges, setBadges] = React.useState<BadgeItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadData() {
      if (!user) return
      setIsLoading(true)
      try {
        const [badgesResult, userBadgesResult] = await Promise.all([
          apiGet<Record<string, BadgeItem[]>>("/badges"),
          apiGet("/user-badges"),
        ])

        let allBadges: BadgeItem[] = []
        let earnedBadgeIds: Set<string> = new Set()

        if (badgesResult.data) {
          const data = badgesResult.data
          allBadges = data.badges || (data as unknown as BadgeItem[]) || []
        }

        if (userBadgesResult.data) {
          const data = userBadgesResult.data
          const userBadges =
            (data as Record<string, unknown>).userBadges || data || []
          earnedBadgeIds = new Set(
            (userBadges as { badgeId: string }[]).map((b) => b.badgeId)
          )
        }

        if (badgesResult.error || userBadgesResult.error) {
          toast.error(
            badgesResult.error ||
              userBadgesResult.error ||
              "Failed to load badges"
          )
        }

        const merged = allBadges.map((badge) => ({
          ...badge,
          earned: earnedBadgeIds.has(badge.id),
        }))
        setBadges(merged)
      } catch (error) {
        console.error("Failed to load badges:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user])

  const earnedCount = badges.filter((b) => b.earned).length

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/achievements">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
          <p className="mt-1 text-muted-foreground">
            Track your achievements and earned rewards
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="size-5 text-primary" />
              <div className="text-2xl font-bold">{badges.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="text-success size-5" />
              <div className="text-2xl font-bold">{earnedCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="size-5 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {badges.length - earnedCount}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {badges.length > 0 ? (
        <BadgeDisplay badges={badges} showAll />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <Award className="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No badges found</h3>
              <p className="text-sm text-muted-foreground">
                Badges are not configured yet. Check back later.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
