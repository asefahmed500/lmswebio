"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
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

  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
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

  const handleSubmit = useCallback(() => {
    onSubmit(answers)
    setShowResults(true)
  }, [answers, onSubmit])

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
      <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" aria-hidden="true" />
              <CardTitle className="text-xl sm:text-2xl">Quiz Submitted!</CardTitle>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your answers have been submitted successfully.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-center py-6 sm:py-8">
              <p className="text-base sm:text-lg">Thank you for completing the quiz.</p>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Your instructor will review your responses and provide feedback.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            {description}
          </p>
        )}

        {/* Timer and progress info */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4">
          {timeLeft && (
            <div
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full",
                timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-muted"
              )}
              aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
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
                "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium shrink-0",
                "w-8 h-8 text-sm sm:w-10 sm:h-10 sm:text-base"
              )}
              aria-label={`Question ${currentQuestion + 1} of ${questions.length}`}
            >
              {currentQuestion + 1}
            </span>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg lg:text-xl">
                {question.text}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {question.points} {question.points === 1 ? "point" : "points"}
              </p>
            </div>
            {question.type !== "TEXT" && (
              <AlertCircle
                className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0"
                aria-label="Select an answer"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          {/* Single choice question */}
          {question.type === "MC_SINGLE" && question.options && (
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              aria-label={question.text}
            >
              <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      "hover:bg-accent hover:border-accent",
                      "transition-colors cursor-pointer",
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
                        "flex-1 cursor-pointer text-sm sm:text-base leading-relaxed",
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
            <div className="space-y-3" role="group" aria-label={question.text}>
              {Object.entries(question.options).map(([key, value]) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    "hover:bg-accent hover:border-accent",
                    "transition-colors cursor-pointer",
                    "focus-within:ring-2 focus-within:ring-ring"
                  )}
                >
                  <Checkbox
                    id={`${question.id}-${key}`}
                    checked={(answers[question.id] || []).includes(key)}
                    onCheckedChange={(checked) => {
                      const current = answers[question.id] || []
                      if (checked) {
                        handleAnswerChange(question.id, [...current, key])
                      } else {
                        handleAnswerChange(question.id, current.filter((v: string) => v !== key))
                      }
                    }}
                    className="mt-0.5 min-h-[24px] min-w-[24px]"
                  />
                  <Label
                    htmlFor={`${question.id}-${key}`}
                    className={cn(
                      "flex-1 cursor-pointer text-sm sm:text-base leading-relaxed",
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
              value={answers[question.id] || ""}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              aria-label={question.text}
            >
              <div className="space-y-3">
                {[
                  { value: "true", label: "True" },
                  { value: "false", label: "False" },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      "hover:bg-accent hover:border-accent",
                      "transition-colors cursor-pointer",
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
        className="flex items-center justify-between mt-6 gap-3 sm:gap-4"
        aria-label="Question navigation"
      >
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={cn(
            "gap-2",
            "h-10 sm:h-11 px-3 sm:px-4",
            "text-sm",
            "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          )}
          aria-label="Go to previous question"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Question indicator */}
        <div className="text-xs sm:text-sm text-muted-foreground px-2">
          Question <strong>{currentQuestion + 1}</strong> of {questions.length}
        </div>

        <Button
          onClick={handleNext}
          className={cn(
            "gap-2",
            "h-10 sm:h-11 px-3 sm:px-4",
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
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </nav>
    </div>
  )
}
