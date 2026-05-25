/**
 * Quiz detail page
 * Displays quiz info, questions, stats, and student results
 */

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  FileText,
  ArrowLeft,
  HelpCircle,
  Clock,
  Users,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
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
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
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

  const loadQuiz = React.useCallback(async () => {
    if (!user || !params.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quizzes/${params.id}`)
      if (!res.ok) throw new Error("Failed to fetch quiz")
      const data = await res.json()
      setQuiz(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load quiz"
      )
    } finally {
      setIsLoading(false)
    }
  }, [user, params.id])

  React.useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

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
      const res = await fetch(`/api/quizzes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          timeLimit: editTimeLimit || undefined,
          attemptsAllowed: editAttempts,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update quiz")
      }
      const updated = await res.json()
      setQuiz(updated)
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
                (a) =>
                  `${a}. ${question.options ? question.options[a] : ""}`
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">
            Error loading quiz
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {error || "Quiz not found"}
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const totalPoints = quiz.questions.reduce(
    (sum, q) => sum + q.points,
    0
  )
  const totalAttempts = quiz.attempts?.length || 0
  const averageScore = totalAttempts > 0
    ? Math.round(
        (quiz.attempts || []).reduce(
          (sum, a) => sum + (a.score || 0),
          0
        ) / totalAttempts
      )
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/instructor/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold"
                disabled={isSaving}
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Quiz description"
                className="min-h-[60px]"
                disabled={isSaving}
              />
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Time Limit (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editTimeLimit ?? ""}
                    onChange={(e) =>
                      setEditTimeLimit(
                        e.target.value
                          ? Number(e.target.value)
                          : undefined
                      )
                    }
                    className="w-32"
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Attempts Allowed</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={editAttempts}
                    onChange={(e) =>
                      setEditAttempts(Number(e.target.value))
                    }
                    className="w-32"
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={isSaving}
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  <Save className="mr-2 h-3 w-3" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="truncate text-2xl font-bold tracking-tight">
                  {quiz.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {quiz.course?.title || `Course #${quiz.courseId}`}{" "}
                  &middot;{" "}
                  {quiz.timeLimit
                    ? `${quiz.timeLimit} min time limit`
                    : "No time limit"}{" "}
                  &middot; {quiz.attemptsAllowed} attempt
                  {quiz.attemptsAllowed !== 1 ? "s" : ""} allowed
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      {quiz.description && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
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
              <HelpCircle className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">
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
              <FileText className="h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold">{totalPoints}</div>
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
              <Users className="h-5 w-5 text-amber-500" />
              <div className="text-2xl font-bold">{totalAttempts}</div>
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
        <CardContent className="space-y-4">
          {quiz.questions.length === 0 ? (
            <div className="py-8 text-center">
              <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No questions yet
              </h3>
              <p className="text-sm text-muted-foreground">
                This quiz has no questions. Edit the quiz to add some.
              </p>
            </div>
          ) : (
            quiz.questions.map((question, index) => (
              <React.Fragment key={question.id}>
                {index > 0 && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
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
                      <div className="ml-4 space-y-1">
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
                                    ? "bg-green-50 text-green-700"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
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
                            variant={
                              isCorrect ? "default" : "outline"
                            }
                            className={
                              isCorrect
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : ""
                            }
                          >
                            {isCorrect && (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            {val}
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  {question.type === QuestionType.TEXT && (
                    <div className="ml-4">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700"
                      >
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
            <div className="py-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No attempts yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Students haven&apos;t taken this quiz yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(quiz.attempts || []).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {attempt.user?.fullName ||
                          `Student #${attempt.userId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          attempt.submittedAt
                        ).toLocaleDateString()}{" "}
                        &middot;{" "}
                        {attempt.submittedAt
                          ? new Date(
                              attempt.submittedAt
                            ).toLocaleTimeString()
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.score !== undefined &&
                    attempt.score !== null ? (
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
