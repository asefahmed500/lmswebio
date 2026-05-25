"use client"

import * as React from "react"
import { Star, ThumbsUp, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export function CourseReviews({ reviews, averageRating, totalReviews }: CourseReviewsProps) {
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
        <CardContent className="py-12">
          <div className="text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to review this course!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {averageRating?.toFixed(1) || "0.0"}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (averageRating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalReviews || reviews.length} reviews
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star as keyof typeof ratingDistribution]
                  const percentage = reviews.length > 0
                    ? (count / reviews.length) * 100
                    : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3">{star}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
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
            <h3 className="font-semibold mb-4">Rating Breakdown</h3>
            <div className="space-y-3">
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
      <div className="space-y-4">
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
          <Avatar className="h-10 w-10">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-medium">{review.user.fullName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
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
              <p className="text-sm text-muted-foreground mb-3">
                {review.review}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <ThumbsUp className="h-3 w-3" />
                Helpful ({review.helpfulVotes})
              </Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <MessageSquare className="h-3 w-3" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
