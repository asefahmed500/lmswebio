"use client"

import * as React from "react"
import { Save, Trash2, Clock, Bookmark } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Note {
  id: number
  content: string
  timestamp: number | null
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  lesson: {
    id: number
    title: string
    module: {
      title: string
      courseId: number
    }
  }
}

interface NotesEditorProps {
  note?: Note
  lessonId?: number
  onSave?: (content: string, timestamp?: number) => void
  onDelete?: () => void
  readOnly?: boolean
}

export function NotesEditor({
  note,
  lessonId,
  onSave,
  onDelete,
  readOnly = false,
}: NotesEditorProps) {
  const [content, setContent] = React.useState(note?.content || "")
  const [timestamp, setTimestamp] = React.useState<number | undefined>(
    note?.timestamp || undefined
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(
    note ? new Date(note.updatedAt) : null
  )

  const handleSave = async () => {
    if (!content.trim()) return

    setIsSaving(true)
    try {
      await onSave?.(content, timestamp)
      setLastSaved(new Date())
    } finally {
      setIsSaving(false)
    }
  }

  const handleTimestampChange = (time: number) => {
    setTimestamp(time)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {note ? "Edit Note" : "New Note"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
              </span>
            )}
            {!readOnly && (
              <>
                {onDelete && note && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!content.trim() || isSaving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>

        {note && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{note.lesson.module.title}</Badge>
            <span className="text-sm text-muted-foreground">
              {note.lesson.title}
            </span>
          </div>
        )}

        {timestamp !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">
              {Math.floor(timestamp / 60)}:{(timestamp % 60).toString().padStart(2, "0")}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start taking notes... (Markdown supported)"
          className="min-h-[300px] resize-none font-mono text-sm"
          readOnly={readOnly}
        />

        {content && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Preview
            </p>
            <div className="prose prose-sm max-w-none">
              {content.split("\n").map((line, i) => (
                <p key={i}>{line || <br />}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
