"use client"

import * as React from "react"
import { Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

interface BadgeDisplayProps {
  badges: BadgeItem[]
  showAll?: boolean
  maxDisplay?: number
}

export function BadgeDisplay({
  badges,
  showAll = false,
  maxDisplay = 8,
}: BadgeDisplayProps) {
  const displayBadges = showAll ? badges : badges.slice(0, maxDisplay)
  const earnedBadges = badges.filter((b) => b.earned)
  const totalPoints = earnedBadges.reduce((sum, b) => sum + b.points, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Stats Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-primary" />
          <span className="font-medium">
            {earnedBadges.length} / {badges.length} Badges
          </span>
        </div>
        <div className="text-muted-foreground">{totalPoints} points</div>
      </div>

      {/* Badges Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>

      {!showAll && badges.length > maxDisplay && (
        <div className="text-center">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            +{badges.length - maxDisplay} more badges
          </Badge>
        </div>
      )}
    </div>
  )
}

function BadgeCard({ badge }: { badge: BadgeItem }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              !badge.earned ? "opacity-50 grayscale" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  className={`size-12 ${badge.earned ? "ring-2 ring-primary" : ""}`}
                >
                  <AvatarImage src={badge.iconUrl || undefined} />
                  <AvatarFallback className="bg-primary/10">
                    <Award className="size-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {badge.points} points
                  </p>
                </div>
                {badge.earned && (
                  <Badge variant="default" className="text-xs">
                    Earned
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="flex flex-col gap-1">
            <p className="font-medium">{badge.name}</p>
            <p className="text-sm text-muted-foreground">{badge.description}</p>
            {badge.earnedAt && (
              <p className="text-xs text-muted-foreground">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
