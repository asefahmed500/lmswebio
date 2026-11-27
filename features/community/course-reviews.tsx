"use client"

import * as React from "react"
import { Star, ThumbsUp, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: number
  rating: number
  review: string | null
  helpfulVotes: number
  createdAt: string
  user: {
    fullName: string
    avatarUrl: string | null
  }
  course: {
    title: string
  }
}

interface CourseReviewsProps {
  reviews: Review[]
  averageRating?: number
  totalReviews?: number
}

export function CourseReviews({
  reviews,
  averageRating,
  totalReviews,
}: CourseReviewsProps) {
  const ratingDistribution = React.useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++
    })
    return distribution
  }, [reviews])

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-0">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Star />
              </EmptyMedia>
              <EmptyTitle>No reviews yet</EmptyTitle>
              <EmptyDescription>
                Be the first to review this course!
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Rating Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-semibold">
                  {averageRating?.toFixed(1) || "0.0"}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < (averageRating || 0)
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalReviews || reviews.length} reviews
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count =
                    ratingDistribution[star as keyof typeof ratingDistribution]
                  const percentage =
                    reviews.length > 0 ? (count / reviews.length) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3">{star}</span>
                      <Star className="size-3 fill-warning text-warning" />
                      <Progress
                        value={percentage}
                        className="h-2 flex-1 [&_[data-slot=progress-indicator]]:bg-warning"
                      />
                      <span className="w-8 text-right text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Rating Breakdown</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">5 stars</span>
                <span className="font-medium">
                  {ratingDistribution[5]} reviews
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">4 stars</span>
                <span className="font-medium">
                  {ratingDistribution[4]} reviews
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">3 stars</span>
                <span className="font-medium">
                  {ratingDistribution[3]} reviews
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">2 stars</span>
                <span className="font-medium">
                  {ratingDistribution[2]} reviews
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">1 star</span>
                <span className="font-medium">
                  {ratingDistribution[1]} reviews
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="size-10">
            <AvatarImage src={review.user.avatarUrl || undefined} />
            <AvatarFallback>
              {review.user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium">{review.user.fullName}</h4>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3 ${
                          i < review.rating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {review.review && (
              <p className="mb-3 text-sm text-muted-foreground">
                {review.review}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="xs">
                <ThumbsUp data-icon="inline-start" />
                Helpful ({review.helpfulVotes})
              </Button>
              <Button variant="ghost" size="xs">
                <MessageSquare data-icon="inline-start" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
