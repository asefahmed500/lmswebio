"use client"

import * as React from "react"
import { Award, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLoading } from "@/components/loading-skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet } from "@/lib/api-client"
import { toast } from "sonner"
import { BadgeDisplay } from "@/features/gamification/badge-display"
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

  if (isLoading) return <DashboardLoading />

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Back to achievements"
        >
          <Link href="/student/achievements">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader
          className="flex-1"
          title="Badges"
          description="Track your achievements and earned rewards"
        />
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
              <div className="text-2xl font-semibold">{badges.length}</div>
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
              <Award className="size-5 text-success" />
              <div className="text-2xl font-semibold">{earnedCount}</div>
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
              <div className="text-2xl font-semibold">
                {badges.length - earnedCount}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {badges.length > 0 ? (
        <BadgeDisplay badges={badges} showAll />
      ) : (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Award />
            </EmptyMedia>
            <EmptyTitle>No badges found</EmptyTitle>
            <EmptyDescription>
              Badges are not configured yet. Check back later.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
