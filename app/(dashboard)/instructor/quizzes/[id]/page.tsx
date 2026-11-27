/**
 * Quiz detail page
 * Displays quiz info, questions, stats, and student results
 */

"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  FileText,
  ArrowLeft,
  ListChecks,
  Users,
  Edit,
  Save,
  X,
  CircleAlert,
  TriangleAlert,
  BarChart3,
  CheckCircle,
  XCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { LoadingCard } from "@/components/loading-skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPut } from "@/lib/api-client"
import { QuestionType } from "@/types"
import type { Quiz, QuizAttempt } from "@/types"

interface QuizDetail extends Quiz {
  attempts?: QuizAttempt[]
}

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [quiz, setQuiz] = React.useState<QuizDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [editTimeLimit, setEditTimeLimit] = React.useState<number | undefined>(
    undefined
  )
  const [editAttempts, setEditAttempts] = React.useState(1)

  React.useEffect(() => {
    if (!user || !params.id) return

    let cancelled = false

    apiGet<{ quiz: QuizDetail }>(`/quizzes/${params.id}`)
      .then((res) => {
        if (!cancelled) {
          if (res.error) throw new Error(res.error)
          setQuiz(res.data!.quiz)
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load quiz")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, params.id])

  const startEditing = () => {
    if (!quiz) return
    setEditTitle(quiz.title)
    setEditDescription(quiz.description || "")
    setEditTimeLimit(quiz.timeLimit)
    setEditAttempts(quiz.attemptsAllowed)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const saveEdit = async () => {
    if (!quiz) return
    setIsSaving(true)
    try {
      const res = await apiPut<{ quiz: QuizDetail }>(`/quizzes/${params.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        timeLimit: editTimeLimit || undefined,
        attemptsAllowed: editAttempts,
      })
      if (res.error) throw new Error(res.error)
      setQuiz(res.data!.quiz)
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update quiz:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const renderCorrectAnswer = (question: Quiz["questions"][number]) => {
    switch (question.type) {
      case QuestionType.MC_SINGLE:
        return (
          <span>
            {question.correctAnswer as string}.{" "}
            {question.options
              ? question.options[question.correctAnswer as string]
              : ""}
          </span>
        )
      case QuestionType.MC_MULTI: {
        const answers = question.correctAnswer as string[]
        return (
          <span>
            {answers
              .map(
                (a) => `${a}. ${question.options ? question.options[a] : ""}`
              )
              .join(", ")}
          </span>
        )
      }
      case QuestionType.TRUE_FALSE:
        return <span>{question.correctAnswer as string}</span>
      case QuestionType.TEXT:
        return (
          <span className="italic">
            &ldquo;{question.correctAnswer as string}&rdquo;
          </span>
        )
      default:
        return null
    }
  }

  const backButton = (
    <Button variant="ghost" size="icon" asChild aria-label="Back to quizzes">
      <Link href="/instructor/quizzes">
        <ArrowLeft />
      </Link>
    </Button>
  )

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          {backButton}
          <PageHeader
            className="min-w-0 flex-1"
            title="Quiz"
            description="Quiz overview and questions"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingCard count={3} />
        </div>
        <LoadingCard />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          {backButton}
          <PageHeader
            className="min-w-0 flex-1"
            title="Error loading quiz"
            description={error || "Quiz not found"}
          />
        </div>
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlert />
            </EmptyMedia>
            <EmptyTitle>Error loading quiz</EmptyTitle>
            <EmptyDescription>{error || "Quiz not found"}</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <div>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)
  const totalAttempts = quiz.attempts?.length || 0
  const averageScore =
    totalAttempts > 0
      ? Math.round(
          (quiz.attempts || []).reduce((sum, a) => sum + (a.score || 0), 0) /
            totalAttempts
        )
      : 0

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-start gap-4">
        {backButton}
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel className="sr-only">Quiz title</FieldLabel>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-semibold"
                  disabled={isSaving}
                />
              </Field>
              <Field>
                <FieldLabel className="sr-only">Quiz description</FieldLabel>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Quiz description"
                  className="min-h-[60px]"
                  disabled={isSaving}
                />
              </Field>
              <div className="flex flex-wrap items-end gap-4">
                <Field>
                  <FieldLabel>Time Limit (min)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={editTimeLimit ?? ""}
                    onChange={(e) =>
                      setEditTimeLimit(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-32"
                    disabled={isSaving}
                  />
                </Field>
                <Field>
                  <FieldLabel>Attempts Allowed</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={editAttempts}
                    onChange={(e) => setEditAttempts(Number(e.target.value))}
                    className="w-32"
                    disabled={isSaving}
                  />
                </Field>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X data-icon="inline-start" />
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          ) : (
            <PageHeader
              className="min-w-0 flex-1"
              title={quiz.title}
              description={
                <>
                  {quiz.course?.title || `Course #${quiz.courseId}`} &middot;{" "}
                  {quiz.timeLimit
                    ? `${quiz.timeLimit} min time limit`
                    : "No time limit"}{" "}
                  &middot; {quiz.attemptsAllowed} attempt
                  {quiz.attemptsAllowed !== 1 ? "s" : ""} allowed
                </>
              }
              action={
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit data-icon="inline-start" />
                  Edit
                </Button>
              }
            />
          )}
        </div>
      </div>

      {quiz.description && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {quiz.description}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ListChecks className="size-5 text-primary" />
              <div className="text-2xl font-semibold">
                {quiz.questions.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-info" />
              <div className="text-2xl font-semibold">{totalPoints}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-warning" />
              <div className="text-2xl font-semibold">{totalAttempts}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            {quiz.questions.length === 0
              ? "No questions in this quiz"
              : `${quiz.questions.length} question${quiz.questions.length !== 1 ? "s" : ""} (${totalPoints} total points)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {quiz.questions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TriangleAlert />
                </EmptyMedia>
                <EmptyTitle>No questions yet</EmptyTitle>
                <EmptyDescription>
                  This quiz has no questions. Edit the quiz to add some.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            quiz.questions.map((question, index) => (
              <React.Fragment key={question.id}>
                {index > 0 && <Separator />}
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">
                        {index + 1}. {question.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {question.type.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline">
                          {question.points} point
                          {question.points !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {(question.type === QuestionType.MC_SINGLE ||
                    question.type === QuestionType.MC_MULTI) &&
                    question.options && (
                      <div className="ml-4 flex flex-col gap-1">
                        {Object.entries(question.options).map(
                          ([key, value]) => {
                            const isCorrect =
                              question.type === QuestionType.MC_SINGLE
                                ? question.correctAnswer === key
                                : (question.correctAnswer as string[]).includes(
                                    key
                                  )
                            return (
                              <div
                                key={key}
                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                                  isCorrect
                                    ? "bg-success/10 text-success"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                                )}
                                <span className="font-medium">{key}.</span>
                                <span>{value}</span>
                              </div>
                            )
                          }
                        )}
                      </div>
                    )}

                  {question.type === QuestionType.TRUE_FALSE && (
                    <div className="ml-4 flex gap-2">
                      {["TRUE", "FALSE"].map((val) => {
                        const isCorrect = question.correctAnswer === val
                        return (
                          <Badge
                            key={val}
                            variant={isCorrect ? "success" : "outline"}
                          >
                            {isCorrect && <CheckCircle />}
                            {val}
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  {question.type === QuestionType.TEXT && (
                    <div className="ml-4">
                      <Badge variant="info">
                        Answer: {question.correctAnswer as string}
                      </Badge>
                    </div>
                  )}

                  <div className="ml-4 text-xs text-muted-foreground">
                    Correct answer: {renderCorrectAnswer(question)}
                  </div>
                </div>
              </React.Fragment>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {totalAttempts === 0
              ? "No attempts yet"
              : `${totalAttempts} attempt${totalAttempts !== 1 ? "s" : ""} (avg score: ${averageScore}%)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalAttempts === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3 />
                </EmptyMedia>
                <EmptyTitle>No attempts yet</EmptyTitle>
                <EmptyDescription>
                  Students haven&apos;t taken this quiz yet
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {(quiz.attempts || []).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {attempt.user?.fullName || `Student #${attempt.userId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.submittedAt).toLocaleDateString()}{" "}
                        &middot;{" "}
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleTimeString()
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.score !== undefined && attempt.score !== null ? (
                      <Badge
                        variant={
                          attempt.score >= 50 ? "default" : "destructive"
                        }
                      >
                        {attempt.score}%
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unscored</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
