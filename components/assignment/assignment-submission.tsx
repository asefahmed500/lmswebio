"use client"

import { useState } from "react"
import { Upload, FileText, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AssignmentSubmissionProps {
  assignment: {
    id: number
    title: string
    description?: string
    dueDate?: Date
    maxPoints: number
  }
  existingSubmission?: {
    id: number
    fileUrl?: string
    textAnswer?: string
    grade?: number
    feedback?: string
    submittedAt: Date
  }
  onSubmit: (data: { file?: File; textAnswer?: string }) => void
}

export function AssignmentSubmission({
  assignment,
  existingSubmission,
  onSubmit,
}: AssignmentSubmissionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [textAnswer, setTextAnswer] = useState(existingSubmission?.textAnswer || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date()
  const hasSubmitted = !!existingSubmission

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file && !textAnswer.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({ file: file || undefined, textAnswer: textAnswer || undefined })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasSubmitted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <CardTitle>Assignment Submitted</CardTitle>
          </div>
          <CardDescription>
            Submitted on {new Date(existingSubmission!.submittedAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingSubmission!.fileUrl && (
            <div>
              <Label>Submitted File</Label>
              <a
                href={existingSubmission!.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-2 text-primary hover:underline"
              >
                <FileText className="w-4 h-4" />
                View submitted file
              </a>
            </div>
          )}

          {existingSubmission!.textAnswer && (
            <div>
              <Label>Text Answer</Label>
              <p className="mt-2 p-3 bg-muted rounded-md text-sm">
                {existingSubmission!.textAnswer}
              </p>
            </div>
          )}

          {existingSubmission!.grade !== undefined && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Grade:</strong> {existingSubmission!.grade} / {assignment.maxPoints}
              </AlertDescription>
            </Alert>
          )}

          {existingSubmission!.feedback && (
            <div>
              <Label>Instructor Feedback</Label>
              <p className="mt-2 p-3 bg-muted rounded-md text-sm">
                {existingSubmission!.feedback}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{assignment.title}</CardTitle>
            {assignment.description && (
              <CardDescription className="mt-2">{assignment.description}</CardDescription>
            )}
          </div>
          {isPastDue && (
            <Badge variant="destructive">Past Due</Badge>
          )}
        </div>
        {assignment.dueDate && (
          <p className="text-sm text-muted-foreground mt-2">
            Due: {new Date(assignment.dueDate).toLocaleString()}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Max Points: {assignment.maxPoints}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload */}
        <div>
          <Label>Upload File (Optional)</Label>
          <div
            className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your file here, or
                </p>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>Browse Files</span>
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Text Answer */}
        <div>
          <Label htmlFor="text-answer">Text Answer (Optional)</Label>
          <Textarea
            id="text-answer"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Enter your answer or comments here..."
            rows={6}
            className="mt-2"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={(!file && !textAnswer.trim()) || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Assignment"}
        </Button>

        {isPastDue && (
          <Alert>
            <AlertDescription>
              This assignment is past due. Late submissions may be subject to penalties.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
