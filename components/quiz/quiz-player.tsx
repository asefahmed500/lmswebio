"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useMediaQuery, Breakpoint } from "@/lib/utils/responsive"
import type { QuizQuestion, QuizAnswers } from "@/types/quiz"

interface QuizPlayerProps {
  quizId: number
  title: string
  description?: string
  questions: QuizQuestion[]
  timeLimit?: number
  onSubmit: (answers: QuizAnswers) => void
}

/**
 * Quiz player component
 * Fully responsive with mobile-optimized question layout and controls
 * - Mobile: Full-width with large touch targets
 * - Desktop: Centered with optimal reading width
 */
export function QuizPlayer({
  quizId,
  title,
  description,
  questions,
  timeLimit,
  onSubmit,
}: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : null)
  const [showResults, setShowResults] = useState(false)
  const isMobile = useMediaQuery("sm" as Breakpoint)

  // Submit handler (defined before useEffect that uses it)
  const handleSubmit = useCallback(() => {
    onSubmit(answers)
    setShowResults(true)
  }, [answers, onSubmit])

  // Timer countdown
  useEffect(() => {
    if (!timeLeft) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, handleSubmit])

  const handleAnswerChange = (
    questionId: number,
    answer: string | string[]
  ) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      // Scroll to top on mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      // Scroll to top on mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  const question = questions[currentQuestion]
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (showResults) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2
                className="text-success size-6 sm:size-8"
                aria-hidden="true"
              />
              <CardTitle className="text-xl sm:text-2xl">
                Quiz Submitted!
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground sm:text-base">
              Your answers have been submitted successfully.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6">
            <div className="py-6 text-center sm:py-8">
              <p className="text-base sm:text-lg">
                Thank you for completing the quiz.
              </p>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Your instructor will review your responses and provide feedback.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && (
          <p className="mb-4 text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}

        {/* Timer and progress info */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
          {timeLeft && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5",
                timeLeft < 60
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted"
              )}
              aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            >
              <Clock className="size-3.5 sm:size-4" aria-hidden="true" />
              <span className="font-mono font-medium">
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 sm:size-4" aria-hidden="true" />
            <span>
              {answeredCount} of {questions.length} answered
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <Progress
          value={progress}
          className="h-2"
          aria-label={`Quiz progress: ${answeredCount} of ${questions.length} questions answered`}
        />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground",
                "size-8 text-sm sm:size-10 sm:text-base"
              )}
              aria-label={`Question ${currentQuestion + 1} of ${questions.length}`}
            >
              {currentQuestion + 1}
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg lg:text-xl">
                {question.text}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {question.points} {question.points === 1 ? "point" : "points"}
              </p>
            </div>
            {question.type !== "TEXT" && (
              <AlertCircle
                className="size-4 shrink-0 text-muted-foreground sm:size-5"
                aria-label="Select an answer"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 sm:p-6">
          {/* Single choice question */}
          {question.type === "MC_SINGLE" && question.options && (
            <RadioGroup
              value={(answers[question.id] as string) || ""}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              aria-label={question.text}
            >
              <div className="flex flex-col gap-3">
                {Object.entries(question.options).map(([key, value]) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3",
                      "hover:border-accent hover:bg-accent",
                      "cursor-pointer transition-colors",
                      "focus-within:ring-2 focus-within:ring-ring"
                    )}
                  >
                    <RadioGroupItem
                      value={key}
                      id={`${question.id}-${key}`}
                      className="mt-0.5 min-h-[24px] min-w-[24px]"
                    />
                    <Label
                      htmlFor={`${question.id}-${key}`}
                      className={cn(
                        "flex-1 cursor-pointer text-sm leading-relaxed sm:text-base",
                        "select-none"
                      )}
                    >
                      {value}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* Multiple choice question */}
          {question.type === "MC_MULTI" && question.options && (
            <div
              className="flex flex-col gap-3"
              role="group"
              aria-label={question.text}
            >
              {Object.entries(question.options).map(([key, value]) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    "hover:border-accent hover:bg-accent",
                    "cursor-pointer transition-colors",
                    "focus-within:ring-2 focus-within:ring-ring"
                  )}
                >
                  <Checkbox
                    id={`${question.id}-${key}`}
                    checked={(
                      (answers[question.id] as string[]) || []
                    ).includes(key)}
                    onCheckedChange={(checked) => {
                      const current = (answers[question.id] as string[]) || []
                      if (checked) {
                        handleAnswerChange(question.id, [...current, key])
                      } else {
                        handleAnswerChange(
                          question.id,
                          current.filter((v: string) => v !== key)
                        )
                      }
                    }}
                    className="mt-0.5 min-h-[24px] min-w-[24px]"
                  />
                  <Label
                    htmlFor={`${question.id}-${key}`}
                    className={cn(
                      "flex-1 cursor-pointer text-sm leading-relaxed sm:text-base",
                      "select-none"
                    )}
                  >
                    {value}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* True/False question */}
          {question.type === "TRUE_FALSE" && (
            <RadioGroup
              value={(answers[question.id] as string) || ""}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              aria-label={question.text}
            >
              <div className="flex flex-col gap-3">
                {[
                  { value: "true", label: "True" },
                  { value: "false", label: "False" },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3",
                      "hover:border-accent hover:bg-accent",
                      "cursor-pointer transition-colors",
                      "focus-within:ring-2 focus-within:ring-ring"
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`${question.id}-${option.value}`}
                      className="min-h-[24px] min-w-[24px]"
                    />
                    <Label
                      htmlFor={`${question.id}-${option.value}`}
                      className={cn(
                        "flex-1 cursor-pointer text-sm sm:text-base",
                        "select-none"
                      )}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* Text answer question */}
          {question.type === "TEXT" && (
            <Textarea
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer here..."
              rows={isMobile ? 8 : 6}
              className="w-full text-sm sm:text-base"
              aria-label={question.text}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <nav
        className="mt-6 flex items-center justify-between gap-3 sm:gap-4"
        aria-label="Question navigation"
      >
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={cn(
            "gap-2",
            "h-10 px-3 sm:h-11 sm:px-4",
            "text-sm",
            "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          )}
          aria-label="Go to previous question"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Question indicator */}
        <div className="px-2 text-xs text-muted-foreground sm:text-sm">
          Question <strong>{currentQuestion + 1}</strong> of {questions.length}
        </div>

        <Button
          onClick={handleNext}
          className={cn(
            "gap-2",
            "h-10 px-3 sm:h-11 sm:px-4",
            "text-sm",
            "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          )}
          aria-label={
            currentQuestion === questions.length - 1
              ? "Submit quiz"
              : "Go to next question"
          }
        >
          <span className="hidden sm:inline">
            {currentQuestion === questions.length - 1 ? "Submit Quiz" : "Next"}
          </span>
          <span className="sm:hidden">
            {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
          </span>
          {currentQuestion < questions.length - 1 && (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </nav>
    </div>
  )
}
