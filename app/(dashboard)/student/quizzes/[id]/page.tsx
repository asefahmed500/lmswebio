/**
 * Student quiz taking page
 * Displays quiz questions, countdown timer, and submission results
 */

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Clock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileQuestion,
  HelpCircle,
  Send,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

interface QuizQuestion {
  id: number
  text: string
  type: "MC_SINGLE" | "MC_MULTI" | "TRUE_FALSE" | "TEXT"
  points: number
  options: Record<string, string> | null
  correctAnswer: string | string[] | null
}

interface QuizData {
  id: number
  title: string
  description: string | null
  courseId: number
  timeLimit: number | null
  attemptsAllowed: number
  questions: QuizQuestion[]
  course: { id: number; title: string }
  _count: { attempts: number }
}

interface AttemptResult {
  id: number
  score: number | null
  submittedAt: string
  answers: Record<string, string | string[]>
}

/**
 * Countdown timer component
 */
function CountdownTimer({
  seconds,
  onExpire,
}: {
  seconds: number
  onExpire: () => void
}) {
  const [remaining, setRemaining] = React.useState(seconds)
  const hasExpired = React.useRef(false)

  React.useEffect(() => {
    if (remaining <= 0) {
      if (!hasExpired.current) {
        hasExpired.current = true
        onExpire()
      }
      return
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining, onExpire])

  const minutes = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
        remaining < 60
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"
      )}
    >
      <Clock className="h-4 w-4" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  )
}

/**
 * Single choice question (radio buttons)
 */
function SingleChoiceQuestion({
  question,
  value,
  onChange,
  showResult,
  correctAnswer,
}: {
  question: QuizQuestion
  value: string
  onChange: (val: string) => void
  showResult: boolean
  correctAnswer: string | string[] | null
}) {
  const options = question.options || {}
  const isCorrect = showResult && value === correctAnswer

  return (
    <div className="space-y-3">
      <RadioGroup value={value} onValueChange={onChange} disabled={showResult}>
        {Object.entries(options).map(([key, label]) => {
          const isCorrectOption = showResult && key === correctAnswer
          const isWrongOption = showResult && key === value && !isCorrect
          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950",
                isWrongOption && "border-red-500 bg-red-50 dark:bg-red-950"
              )}
            >
              <RadioGroupItem value={key} id={`${question.id}_${key}`} />
              <Label
                htmlFor={`${question.id}_${key}`}
                className="flex-1 cursor-pointer"
              >
                {label}
              </Label>
              {isCorrectOption && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {isWrongOption && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

/**
 * Multiple choice question (checkboxes)
 */
function MultiChoiceQuestion({
  question,
  value,
  onChange,
  showResult,
  correctAnswer,
}: {
  question: QuizQuestion
  value: string[]
  onChange: (val: string[]) => void
  showResult: boolean
  correctAnswer: string | string[] | null
}) {
  const options = question.options || {}
  const correctArray = Array.isArray(correctAnswer) ? correctAnswer : []

  const handleToggle = (key: string) => {
    if (showResult) return
    if (value.includes(key)) {
      onChange(value.filter((v) => v !== key))
    } else {
      onChange([...value, key])
    }
  }

  return (
    <div className="space-y-3">
      {Object.entries(options).map(([key, label]) => {
        const isSelected = value.includes(key)
        const isCorrectOption = showResult && correctArray.includes(key)
        const isWrongOption =
          showResult && isSelected && !correctArray.includes(key)
        const isMissing = showResult && !isSelected && correctArray.includes(key)
        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3",
              isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950",
              isWrongOption && "border-red-500 bg-red-50 dark:bg-red-950",
              isMissing && "border-orange-300 bg-orange-50 dark:bg-orange-950"
            )}
          >
            <Checkbox
              id={`${question.id}_${key}`}
              checked={isSelected}
              onCheckedChange={() => handleToggle(key)}
              disabled={showResult}
            />
            <Label
              htmlFor={`${question.id}_${key}`}
              className="flex-1 cursor-pointer"
            >
              {label}
            </Label>
            {isCorrectOption && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            {isWrongOption && (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            {isMissing && (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Text answer question (textarea)
 */
function TextQuestion({
  question,
  value,
  onChange,
  showResult,
}: {
  question: QuizQuestion
  value: string
  onChange: (val: string) => void
  showResult: boolean
}) {
  return (
    <Textarea
      placeholder="Type your answer here..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={showResult}
      className="min-h-[120px]"
    />
  )
}

/**
 * True/False question (radio buttons)
 */
function TrueFalseQuestion({
  question,
  value,
  onChange,
  showResult,
  correctAnswer,
}: {
  question: QuizQuestion
  value: string
  onChange: (val: string) => void
  showResult: boolean
  correctAnswer: string | string[] | null
}) {
  const isTrueCorrect = showResult && correctAnswer === "true"
  const isFalseCorrect = showResult && correctAnswer === "false"
  const selectedTrue = value === "true"
  const selectedFalse = value === "false"

  return (
    <div className="flex gap-3">
      {["true", "false"].map((opt) => {
        const isCorrectOption =
          showResult && opt === correctAnswer
        const isWrongOption =
          showResult && opt === value && opt !== correctAnswer
        const isSelected = opt === value
        return (
          <button
            key={opt}
            onClick={() => !showResult && onChange(opt)}
            disabled={showResult}
            className={cn(
              "flex-1 rounded-lg border-2 p-4 text-center font-medium transition-colors",
              isSelected && !showResult && "border-primary bg-primary/10",
              isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950 text-green-700",
              isWrongOption && "border-red-500 bg-red-50 dark:bg-red-950 text-red-700",
              !isSelected && !showResult && "border-border hover:border-primary/50"
            )}
          >
            {opt === "true" ? "True" : "False"}
            {isCorrectOption && (
              <CheckCircle2 className="mx-auto mt-1 h-4 w-4" />
            )}
            {isWrongOption && <XCircle className="mx-auto mt-1 h-4 w-4" />}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Quiz question renderer
 */
function QuestionRenderer({
  question,
  answers,
  onAnswer,
  showResult,
}: {
  question: QuizQuestion
  answers: Record<number, string | string[]>
  onAnswer: (questionId: number, answer: string | string[]) => void
  showResult: boolean
}) {
  const value = answers[question.id] || (question.type === "MC_MULTI" ? [] : "")

  return (
    <Card key={question.id}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-relaxed">
            {question.text}
          </CardTitle>
          <Badge variant="outline" className="shrink-0">
            {question.points} pt{question.points > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {question.type === "MC_SINGLE" && (
          <SingleChoiceQuestion
            question={question}
            value={value as string}
            onChange={(val) => onAnswer(question.id, val)}
            showResult={showResult}
            correctAnswer={question.correctAnswer}
          />
        )}
        {question.type === "MC_MULTI" && (
          <MultiChoiceQuestion
            question={question}
            value={value as string[]}
            onChange={(val) => onAnswer(question.id, val)}
            showResult={showResult}
            correctAnswer={question.correctAnswer}
          />
        )}
        {question.type === "TRUE_FALSE" && (
          <TrueFalseQuestion
            question={question}
            value={value as string}
            onChange={(val) => onAnswer(question.id, val)}
            showResult={showResult}
            correctAnswer={question.correctAnswer}
          />
        )}
        {question.type === "TEXT" && (
          <TextQuestion
            question={question}
            value={value as string}
            onChange={(val) => onAnswer(question.id, val)}
            showResult={showResult}
          />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Quiz results component
 */
function QuizResults({
  quiz,
  attempts,
}: {
  quiz: QuizData
  attempts: AttemptResult[]
}) {
  const latestAttempt = attempts[0]
  const bestScore = Math.max(
    ...attempts.map((a) => a.score ?? 0)
  )
  const latestScore = latestAttempt?.score ?? 0
  const totalPoints = quiz.questions.reduce(
    (sum, q) => sum + q.points,
    0
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{quiz.title} - Results</h2>
        <p className="mt-1 text-muted-foreground">{quiz.course.title}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-center">
            <div
              className={cn(
                "text-3xl font-bold",
                latestScore >= 70
                  ? "text-green-600"
                  : latestScore >= 40
                    ? "text-amber-600"
                    : "text-red-600"
              )}
            >
              {latestScore.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-center">
            <div
              className={cn(
                "text-3xl font-bold",
                bestScore >= 70
                  ? "text-green-600"
                  : bestScore >= 40
                    ? "text-amber-600"
                    : "text-red-600"
              )}
            >
              {bestScore.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attempts Used
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-center">
            <div className="text-3xl font-bold">
              {attempts.length}
              <span className="text-lg text-muted-foreground">
                /{quiz.attemptsAllowed}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Question Review</h3>
        {quiz.questions.map((question) => {
          const answer = latestAttempt?.answers[question.id.toString()]
          const isCorrect =
            question.type === "MC_SINGLE" || question.type === "TRUE_FALSE"
              ? answer === question.correctAnswer
              : question.type === "MC_MULTI"
                ? Array.isArray(question.correctAnswer) &&
                  Array.isArray(answer) &&
                  question.correctAnswer.length === answer.length &&
                  question.correctAnswer.every((c) => answer.includes(c))
                : undefined
          return (
            <Card
              key={question.id}
              className={cn(
                isCorrect === true && "border-l-4 border-l-green-500",
                isCorrect === false && "border-l-4 border-l-red-500"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">
                    {question.text}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      isCorrect === true
                        ? "border-green-500 text-green-600"
                        : isCorrect === false
                          ? "border-red-500 text-red-600"
                          : ""
                    }
                  >
                    {isCorrect === true
                      ? "Correct"
                      : isCorrect === false
                        ? "Incorrect"
                        : "Review Required"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                {question.options && (
                  <div className="mb-2">
                    <span className="font-medium">Your answer: </span>
                    {Array.isArray(answer)
                      ? answer
                          .map((a) => question.options?.[a] || a)
                          .join(", ")
                      : question.options?.[answer as string] || answer || "No answer"}
                  </div>
                )}
                {isCorrect === false && question.correctAnswer && (
                  <div className="text-green-600">
                    <span className="font-medium">Correct answer: </span>
                    {Array.isArray(question.correctAnswer)
                      ? question.correctAnswer
                          .map((c) => question.options?.[c] || c)
                          .join(", ")
                      : question.options?.[question.correctAnswer] ||
                        question.correctAnswer}
                  </div>
                )}
                <div className="mt-1 text-muted-foreground">
                  {question.points} point{question.points > 1 ? "s" : ""}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center gap-4">
        {attempts.length < quiz.attemptsAllowed && (
          <Button asChild>
            <Link href={`/student/quizzes/${quiz.id}`}>Retake Quiz</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/student/quizzes">Back to Quizzes</Link>
        </Button>
      </div>
    </div>
  )
}

/**
 * Quiz taking page component
 */
export default function QuizTakingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const quizId = parseInt(params.id as string)

  const [quiz, setQuiz] = React.useState<QuizData | null>(null)
  const [attempts, setAttempts] = React.useState<AttemptResult[]>([])
  const [answers, setAnswers] = React.useState<Record<number, string | string[]>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [submissionResult, setSubmissionResult] =
    React.useState<AttemptResult | null>(null)
  const [timeExpired, setTimeExpired] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      if (!quizId || !user) return

      setIsLoading(true)
      try {
        const [quizRes, attemptsRes] = await Promise.all([
          fetch(`/api/quizzes/${quizId}`),
          fetch(`/api/quizzes/${quizId}/attempt`),
        ])

        if (!quizRes.ok) {
          router.push("/student/quizzes")
          return
        }

        const quizData: QuizData = await quizRes.json()
        const attemptsData: AttemptResult[] = attemptsRes.ok
          ? await attemptsRes.json()
          : []

        setQuiz(quizData)
        setAttempts(attemptsData)

        const initialAnswers: Record<number, string | string[]> = {}
        quizData.questions.forEach((q) => {
          if (q.type === "MC_MULTI") {
            initialAnswers[q.id] = []
          } else {
            initialAnswers[q.id] = ""
          }
        })
        setAnswers(initialAnswers)
      } catch (error) {
        console.error("Failed to load quiz:", error)
        router.push("/student/quizzes")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [quizId, user, router])

  const handleAnswer = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = React.useCallback(async () => {
    if (!quiz || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to submit quiz")
      }

      const result: AttemptResult = await res.json()
      setSubmissionResult(result)
      setSubmitted(true)

      const updatedRes = await fetch(`/api/quizzes/${quizId}/attempt`)
      if (updatedRes.ok) {
        const updatedAttempts: AttemptResult[] = await updatedRes.json()
        setAttempts(updatedAttempts)
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [quiz, quizId, answers, isSubmitting])

  const handleTimeExpire = React.useCallback(() => {
    setTimeExpired(true)
    handleSubmit()
  }, [handleSubmit])

  const remainingAttempts = quiz
    ? quiz.attemptsAllowed - attempts.length
    : 0

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

  if (!quiz) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Quiz not found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            The quiz you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/student/quizzes">Back to Quizzes</Link>
          </Button>
        </div>
      </div>
    )
  }

  const answeredCount = quiz.questions.filter((q) => {
    const answer = answers[q.id]
    if (q.type === "MC_MULTI") {
      return Array.isArray(answer) && answer.length > 0
    }
    return typeof answer === "string" && answer !== ""
  }).length

  const allAnswered = answeredCount === quiz.questions.length

  if (
    attempts.length >= quiz.attemptsAllowed &&
    !submitted &&
    attempts.length > 0
  ) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <QuizResults quiz={quiz} attempts={attempts} />
      </div>
    )
  }

  if (submitted && submissionResult) {
    const allAttempts = attempts.length > 0 ? attempts : [submissionResult]
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <QuizResults quiz={quiz} attempts={allAttempts} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Quiz header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => router.push("/student/quizzes")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="mt-1 text-muted-foreground">{quiz.course.title}</p>
          {quiz.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {quiz.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {quiz.timeLimit && !timeExpired && (
            <CountdownTimer
              seconds={quiz.timeLimit * 60}
              onExpire={handleTimeExpire}
            />
          )}
          <Badge variant="secondary" className="text-sm">
            {answeredCount}/{quiz.questions.length} answered
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress
        value={(answeredCount / quiz.questions.length) * 100}
        className="h-2"
      />

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <div key={question.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {index + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {question.type === "MC_SINGLE"
                  ? "Single Choice"
                  : question.type === "MC_MULTI"
                    ? "Multiple Choice"
                    : question.type === "TRUE_FALSE"
                      ? "True / False"
                      : "Text Answer"}
              </span>
            </div>
            <QuestionRenderer
              question={question}
              answers={answers}
              onAnswer={handleAnswer}
              showResult={false}
            />
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground">
          {remainingAttempts > 0 && (
            <span>
              {remainingAttempts} attempt{remainingAttempts > 1 ? "s" : ""}{" "}
              remaining
            </span>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
