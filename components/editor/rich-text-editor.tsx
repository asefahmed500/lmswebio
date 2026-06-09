"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ListItem from "@tiptap/extension-list-item"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Link,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { clsx } from "clsx"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      ListItem,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable,
  })

  if (!editor) {
    return null
  }

  const setLink = () => {
    const url = window.prompt("Enter URL:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("code")}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="size-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-8" />

          <Select
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor.isActive("heading", { level: 3 })
                    ? "h3"
                    : "p"
            }
            onValueChange={(value: string) => {
              if (value === "p") {
                editor.chain().focus().setParagraph().run()
              } else if (value === "h1") {
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              } else if (value === "h2") {
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              } else if (value === "h3") {
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            }}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8" />

          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <List className="size-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
          >
            <ListOrdered className="size-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-8" />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().extendMarkRange("left").run()}
            className={editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""}
          >
            <AlignLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              editor.chain().focus().extendMarkRange("center").run()
            }
            className={
              editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""
            }
          >
            <AlignCenter className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              editor.chain().focus().extendMarkRange("right").run()
            }
            className={
              editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""
            }
          >
            <AlignRight className="size-4" />
          </Button>
          <Toggle
            size="sm"
            pressed={editor.isActive("blockquote")}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
          >
            <Quote className="size-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-8" />

          <Button size="sm" variant="ghost" onClick={setLink}>
            <Link className="size-4" />
          </Button>

          <Separator orientation="vertical" className="h-8" />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="size-4" />
          </Button>
        </div>
      )}

      <EditorContent
        className="prose prose-sm sm:prose lg:prose-lg min-h-[200px] max-w-none p-4 focus:outline-none"
        editor={editor}
      />

      <style>{`
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}
