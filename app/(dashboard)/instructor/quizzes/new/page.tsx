"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  CircleAlert,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/components/auth-provider"
import { apiGet, apiPost } from "@/lib/api-client"
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
        const res = await apiGet<{ courses?: unknown[] }>("/courses")
        if (res.error) throw new Error(res.error)
        const data = res.data as { courses?: unknown[] } | undefined
        setCourses((data?.courses as typeof courses) || [])
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
      // apiPost attaches the X-CSRF-Token header. A raw fetch here is rejected
      // by the middleware with 403 "Invalid CSRF token", which made quiz
      // creation impossible.
      const res = await apiPost<{ quiz: unknown }>("/quizzes", {
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
      })
      if (res.error) {
        throw new Error(res.error)
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
          <Field>
            <FieldLabel>Correct Answer</FieldLabel>
            <Select
              value={String(q.correctAnswer || "")}
              onValueChange={(value) =>
                updateQuestion(qIndex, "correctAnswer", value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(q.options)
                    .filter(([, v]) => v.trim())
                    .map(([key]) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        )
      case QuestionType.MC_MULTI:
        return (
          <Field>
            <FieldLabel>Correct Answers (select all that apply)</FieldLabel>
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
          </Field>
        )
      case QuestionType.TRUE_FALSE:
        return (
          <Field>
            <FieldLabel>Correct Answer</FieldLabel>
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
          </Field>
        )
      case QuestionType.TEXT:
        return (
          <Field>
            <FieldLabel>Correct Answer</FieldLabel>
            <Input
              placeholder="Enter the correct answer"
              value={String(q.correctAnswer || "")}
              onChange={(e) =>
                updateQuestion(qIndex, "correctAnswer", e.target.value)
              }
            />
          </Field>
        )
      default:
        return null
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Back to quizzes"
        >
          <Link href="/instructor/quizzes">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader
          className="min-w-0 flex-1"
          title="Create New Quiz"
          description="Fill in the details and add questions to create a new quiz"
        />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
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
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Quiz Title *</FieldLabel>
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
                <FieldError>{titleError}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Describe the quiz, topics covered, and any instructions..."
                  className="min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </Field>

              <div className="grid min-w-0 gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="courseId">Course *</FieldLabel>
                  <Select
                    value={courseId ? String(courseId) : ""}
                    onValueChange={(value) => {
                      setCourseId(value)
                      if (courseError) setCourseError(null)
                    }}
                    disabled={isSubmitting || isLoadingCourses}
                  >
                    <SelectTrigger id="courseId" className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingCourses
                            ? "Loading courses..."
                            : "Select a course"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={String(course.id)}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{courseError}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="timeLimit">
                    Time Limit (minutes)
                  </FieldLabel>
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
                </Field>

                <Field>
                  <FieldLabel htmlFor="attemptsAllowed">
                    Attempts Allowed *
                  </FieldLabel>
                  <Input
                    id="attemptsAllowed"
                    type="number"
                    min={1}
                    max={10}
                    value={attemptsAllowed}
                    onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </Field>
              </div>
            </FieldGroup>
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
          <CardContent>
            <FieldGroup className="gap-6">
              {questions.map((q, qIndex) => (
                <React.Fragment key={qIndex}>
                  {qIndex > 0 && <Separator />}
                  <FieldGroup className="min-w-0 gap-4 rounded-lg border bg-muted/20 p-4">
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
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => removeQuestion(qIndex)}
                          aria-label="Delete question"
                          disabled={isSubmitting}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>

                    <div className="grid min-w-0 gap-4 md:grid-cols-2">
                      <Field className="md:col-span-2">
                        <FieldLabel>Question Text *</FieldLabel>
                        <Input
                          placeholder="Enter your question"
                          value={q.text}
                          onChange={(e) =>
                            updateQuestion(qIndex, "text", e.target.value)
                          }
                          disabled={isSubmitting}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Question Type *</FieldLabel>
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
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
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
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>Points *</FieldLabel>
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
                      </Field>
                    </div>

                    {(q.type === QuestionType.MC_SINGLE ||
                      q.type === QuestionType.MC_MULTI) && (
                      <Field>
                        <FieldLabel>Options *</FieldLabel>
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
                      </Field>
                    )}

                    {renderCorrectAnswerInput(q, qIndex)}
                  </FieldGroup>
                </React.Fragment>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
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
