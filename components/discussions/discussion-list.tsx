"use client"

import * as React from "react"
import Link from "next/link"
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  CheckCircle,
  Clock,
  User,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface Discussion {
  id: number
  title: string
  content: string
  isPinned: boolean
  isResolved: boolean
  createdAt: string
  user: {
    id: number
    fullName: string
    avatarUrl: string | null
    role: string
  }
  course: {
    id: number
    title: string
    slug: string
  }
  _count: {
    comments: number
    votes: number
  }
  userVote: number
}

interface DiscussionListProps {
  discussions: Discussion[]
  courseId?: number
}

export function DiscussionList({ discussions, courseId }: DiscussionListProps) {
  if (discussions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <MessageSquare className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No discussions yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Be the first to start a discussion!
            </p>
            <Button asChild>
              <Link
                href={`/student/discussions${courseId ? `?courseId=${courseId}` : ""}`}
              >
                Start Discussion
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {discussions.map((discussion) => (
        <DiscussionCard key={discussion.id} discussion={discussion} />
      ))}
    </div>
  )
}

function DiscussionCard({ discussion }: { discussion: Discussion }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={discussion.user.avatarUrl || undefined} />
            <AvatarFallback>
              {discussion.user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {discussion.isPinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="size-3" />
                    Pinned
                  </Badge>
                )}
                {discussion.isResolved && (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="size-3" />
                    Resolved
                  </Badge>
                )}
                {discussion.user.role === "INSTRUCTOR" && (
                  <Badge variant="default">Instructor</Badge>
                )}
              </div>
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {formatDistanceToNow(new Date(discussion.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <Link
              href={`/discussions/${discussion.id}`}
              className="group block"
            >
              <h3 className="mb-1 text-base font-semibold transition-colors group-hover:text-primary">
                {discussion.title}
              </h3>
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                {discussion.content}
              </p>
            </Link>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="size-4" />
                  {discussion.user.fullName}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-4" />
                  {discussion._count.comments} comments
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    discussion.userVote > 0 ? "text-success" : ""
                  }`}
                >
                  <ThumbsUp className="size-4" />
                  {discussion._count.votes} helpful
                </span>
              </div>

              <Link
                href={`/courses/${discussion.course.slug}`}
                className="text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                {discussion.course.title}
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
