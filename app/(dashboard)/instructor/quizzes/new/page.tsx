"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { QuestionType } from "@/types"
import type { Course } from "@/types"

interface QuestionForm {
  text: string
  type: QuestionType
  points: number
  options: Record<string, string>
  correctAnswer: string | string[]
}

const defaultOptions: Record<string, string> = {
  A: "",
  B: "",
  C: "",
  D: "",
}

function createEmptyQuestion(): QuestionForm {
  return {
    text: "",
    type: QuestionType.MC_SINGLE,
    points: 10,
    options: { ...defaultOptions },
    correctAnswer: "",
  }
}

export default function NewQuizPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [courseId, setCourseId] = React.useState<string | undefined>(undefined)
  const [timeLimit, setTimeLimit] = React.useState<number | undefined>(
    undefined
  )
  const [attemptsAllowed, setAttemptsAllowed] = React.useState(1)
  const [titleError, setTitleError] = React.useState<string | null>(null)
  const [courseError, setCourseError] = React.useState<string | null>(null)

  const [questions, setQuestions] = React.useState<QuestionForm[]>([
    createEmptyQuestion(),
  ])

  React.useEffect(() => {
    async function loadCourses() {
      if (!user) return
      try {
        const res = await fetch("/api/courses")
        if (!res.ok) throw new Error("Failed to fetch courses")
        const data = await res.json()
        setCourses(data.courses || data)
      } catch (err) {
        console.error("Failed to load courses:", err)
      } finally {
        setIsLoadingCourses(false)
      }
    }
    loadCourses()
  }, [user])

  const updateQuestion = (
    index: number,
    field: keyof QuestionForm,
    value: unknown
  ) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const updateOption = (qIndex: number, key: string, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[qIndex] = {
        ...updated[qIndex],
        options: { ...updated[qIndex].options, [key]: value },
      }
      return updated
    })
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()])
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = (): boolean => {
    let valid = true
    if (!title.trim()) {
      setTitleError("Quiz title is required")
      valid = false
    } else {
      setTitleError(null)
    }
    if (!courseId) {
      setCourseError("Please select a course")
      valid = false
    } else {
      setCourseError(null)
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        valid = false
        break
      }
      if (
        q.type === QuestionType.MC_SINGLE ||
        q.type === QuestionType.MC_MULTI
      ) {
        const filledOptions = Object.entries(q.options).filter(([, v]) =>
          v.trim()
        )
        if (filledOptions.length < 2) {
          valid = false
          break
        }
        if (
          !q.correctAnswer ||
          (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)
        ) {
          valid = false
          break
        }
      }
      if (q.type === QuestionType.TRUE_FALSE && !q.correctAnswer) {
        valid = false
        break
      }
      if (q.type === QuestionType.TEXT && !q.correctAnswer) {
        valid = false
        break
      }
    }
    return valid
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          courseId,
          timeLimit: timeLimit || undefined,
          attemptsAllowed,
          questions: questions.map((q) => ({
            text: q.text.trim(),
            type: q.type,
            points: q.points,
            options:
              q.type === QuestionType.MC_SINGLE ||
              q.type === QuestionType.MC_MULTI
                ? Object.fromEntries(
                    Object.entries(q.options).filter(([, v]) => v.trim())
                  )
                : undefined,
            correctAnswer: q.correctAnswer,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create quiz")
      }
      router.push("/instructor/quizzes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quiz")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCorrectAnswerInput = (q: QuestionForm, qIndex: number) => {
    switch (q.type) {
      case QuestionType.MC_SINGLE:
        return (
          <div className="flex flex-col gap-2">
            <Label>Correct Answer</Label>
            <Select
              value={String(q.correctAnswer || "")}
              onValueChange={(value) =>
                updateQuestion(qIndex, "correctAnswer", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(q.options)
                  .filter(([, v]) => v.trim())
                  .map(([key]) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )
      case QuestionType.MC_MULTI:
        return (
          <div className="flex flex-col gap-2">
            <Label>Correct Answers (select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(q.options)
                .filter(([, v]) => v.trim())
                .map(([key]) => {
                  const current = (q.correctAnswer as string[]) || []
                  const isSelected = current.includes(key)
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const next = isSelected
                          ? current.filter((k) => k !== key)
                          : [...current, key]
                        updateQuestion(qIndex, "correctAnswer", next)
                      }}
                    >
                      {key}
                    </Button>
                  )
                })}
            </div>
          </div>
        )
      case QuestionType.TRUE_FALSE:
        return (
          <div className="flex flex-col gap-2">
            <Label>Correct Answer</Label>
            <div className="flex gap-2">
              {["True", "False"].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant={
                    q.correctAnswer === val.toUpperCase()
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    updateQuestion(qIndex, "correctAnswer", val.toUpperCase())
                  }
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>
        )
      case QuestionType.TEXT:
        return (
          <div className="flex flex-col gap-2">
            <Label>Correct Answer</Label>
            <Input
              placeholder="Enter the correct answer"
              value={String(q.correctAnswer || "")}
              onChange={(e) =>
                updateQuestion(qIndex, "correctAnswer", e.target.value)
              }
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/instructor/quizzes">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Quiz</h1>
          <p className="mt-1 text-muted-foreground">
            Fill in the details and add questions to create a new quiz
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>
              Define the quiz parameters and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Week 1: JavaScript Fundamentals"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError) setTitleError(null)
                }}
                disabled={isSubmitting}
              />
              {titleError && (
                <p className="text-sm text-destructive">{titleError}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the quiz, topics covered, and any instructions..."
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="courseId">Course *</Label>
                <Select
                  value={courseId ? String(courseId) : ""}
                  onValueChange={(value) => {
                    setCourseId(value)
                    if (courseError) setCourseError(null)
                  }}
                  disabled={isSubmitting || isLoadingCourses}
                >
                  <SelectTrigger id="courseId">
                    <SelectValue
                      placeholder={
                        isLoadingCourses
                          ? "Loading courses..."
                          : "Select a course"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {courseError && (
                  <p className="text-sm text-destructive">{courseError}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={1}
                  placeholder="Optional"
                  value={timeLimit ?? ""}
                  onChange={(e) =>
                    setTimeLimit(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="attemptsAllowed">Attempts Allowed *</Label>
                <Input
                  id="attemptsAllowed"
                  type="number"
                  min={1}
                  max={10}
                  value={attemptsAllowed}
                  onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Add questions to the quiz ({questions.length} question
                  {questions.length !== 1 ? "s" : ""})
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                disabled={isSubmitting || questions.length >= 50}
              >
                <Plus data-icon="inline-start" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {questions.map((q, qIndex) => (
              <React.Fragment key={qIndex}>
                {qIndex > 0 && <Separator />}
                <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Question {qIndex + 1}
                      </span>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label>Question Text *</Label>
                      <Input
                        placeholder="Enter your question"
                        value={q.text}
                        onChange={(e) =>
                          updateQuestion(qIndex, "text", e.target.value)
                        }
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Question Type *</Label>
                      <Select
                        value={q.type}
                        onValueChange={(value) => {
                          const type = value as QuestionType
                          updateQuestion(qIndex, "type", type)
                          updateQuestion(qIndex, "correctAnswer", "")
                          updateQuestion(
                            qIndex,
                            "options",
                            type === QuestionType.MC_SINGLE ||
                              type === QuestionType.MC_MULTI
                              ? { ...defaultOptions }
                              : undefined
                          )
                        }}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={QuestionType.MC_SINGLE}>
                            Multiple Choice (Single)
                          </SelectItem>
                          <SelectItem value={QuestionType.MC_MULTI}>
                            Multiple Choice (Multi)
                          </SelectItem>
                          <SelectItem value={QuestionType.TRUE_FALSE}>
                            True / False
                          </SelectItem>
                          <SelectItem value={QuestionType.TEXT}>
                            Text Answer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Points *</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "points",
                            Number(e.target.value)
                          )
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {(q.type === QuestionType.MC_SINGLE ||
                    q.type === QuestionType.MC_MULTI) && (
                    <div className="flex flex-col gap-3">
                      <Label>Options *</Label>
                      {["A", "B", "C", "D"].map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-6 text-sm font-medium text-muted-foreground">
                            {key}
                          </span>
                          <Input
                            placeholder={`Option ${key}`}
                            value={q.options[key] || ""}
                            onChange={(e) =>
                              updateOption(qIndex, key, e.target.value)
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {renderCorrectAnswerInput(q, qIndex)}
                </div>
              </React.Fragment>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Quiz
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
