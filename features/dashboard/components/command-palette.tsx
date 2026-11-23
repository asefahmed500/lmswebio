"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BookOpen,
  type LucideIcon,
  Monitor,
  Moon,
  Search,
  Sun,
} from "lucide-react"

import type { Role } from "@/types"
import { apiGet } from "@/lib/api-client"
import { getNavConfig, type NavItem } from "@/features/dashboard/nav/config"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

type PaletteEntry = NavItem & { group: string }

const THEME_ACTIONS = [
  {
    title: "Light theme",
    value: "light",
    icon: Sun,
    keywords: ["appearance", "light mode"],
  },
  {
    title: "Dark theme",
    value: "dark",
    icon: Moon,
    keywords: ["appearance", "dark mode"],
  },
  {
    title: "System theme",
    value: "system",
    icon: Monitor,
    keywords: ["appearance", "auto"],
  },
] as const

function StaticItem({
  icon: Icon,
  title,
  keywords,
  onSelect,
}: {
  icon: LucideIcon
  title: string
  keywords?: readonly string[]
  onSelect: () => void
}) {
  return (
    <CommandItem
      value={`${title} ${keywords?.join(" ") ?? ""}`}
      onSelect={onSelect}
    >
      <Icon className="size-4 text-muted-foreground" />
      <span>{title}</span>
    </CommandItem>
  )
}

/**
 * Command palette for the app shell (Cmd/Ctrl+K).
 *
 * Replaces the two separate search forms that previously lived in the header
 * and the sidebar. Those two forms were duplicated markup that routed to three
 * different URLs depending on role, so they could drift out of sync. This
 * palette reads from the same `nav/config.ts` the sidebar reads from, then
 * falls back to the `/api/search` endpoint for dynamic results.
 */
export function CommandPalette({ role }: { role: Role }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  // Remote results are stored against the query that produced them, so the
  // effect never has to clear state synchronously — visibility is derived
  // below by comparing the stored query with the live one.
  const [remote, setRemote] = React.useState<{
    q: string
    items: PaletteEntry[]
  }>({ q: "", items: [] })
  const [pendingQuery, setPendingQuery] = React.useState<string | null>(null)
  const router = useRouter()
  const { setTheme } = useTheme()

  const activeQuery = query.trim()
  const remoteResults =
    activeQuery.length >= 2 && remote.q === activeQuery ? remote.items : []
  const searching = activeQuery.length >= 2 && pendingQuery === activeQuery

  const config = React.useMemo(() => getNavConfig(role), [role])
  const navEntries = React.useMemo<PaletteEntry[]>(() => {
    const withGroup: PaletteEntry[] = [
      ...config.primary.map((i) => ({ ...i, group: "Overview" })),
      ...config.sections.flatMap((s) =>
        s.items.map((i) => ({ ...i, group: s.title }))
      ),
      ...config.secondary.map((i) => ({ ...i, group: "Account" })),
    ]
    return withGroup
  }, [config])

  const themeActions = THEME_ACTIONS

  // Register the global shortcut.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  // Debounced remote search.
  //
  // No setState happens synchronously in the effect body: short queries simply
  // return without touching state, and everything else is deferred into the
  // timeout. That keeps the React Compiler lint happy and avoids a cascading
  // render on every keystroke. Queries under 2 characters are skipped because
  // the search API requires at least 2 anyway.
  React.useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setPendingQuery(trimmed)
      const basePath =
        role === "STUDENT" ? "/student" : `/${role.toLowerCase()}`
      try {
        const result = await apiGet<{
          courses?: { id: string; title: string; slug?: string }[]
        }>("/search?q=" + encodeURIComponent(trimmed), {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        const courses = result.data?.courses ?? []
        setRemote({
          q: trimmed,
          items: courses.map((c) => ({
            title: c.title,
            href: `${basePath}/courses/${c.slug ?? c.id}`,
            icon: BookOpen,
            group: "Courses",
            keywords: [c.slug ?? c.id],
          })),
        })
      } catch {
        // Non-fatal: the static nav results still render.
      } finally {
        if (!controller.signal.aborted) setPendingQuery(null)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, role])

  const run = React.useCallback(
    (href: string) => {
      setOpen(false)
      setQuery("")
      router.push(href)
    },
    [router]
  )

  const applyTheme = React.useCallback(
    (value: string) => {
      setOpen(false)
      setQuery("")
      setTheme(value)
    },
    [setTheme]
  )

  // Group the static entries, preserving config order.
  const grouped = React.useMemo(() => {
    const map = new Map<string, PaletteEntry[]>()
    for (const entry of navEntries) {
      const list = map.get(entry.group) ?? []
      list.push(entry)
      map.set(entry.group, list)
    }
    return Array.from(map.entries())
  }, [navEntries])

  return (
    <>
      <Button
        variant="outline"
        className="hidden h-9 w-64 justify-between text-muted-foreground lg:flex"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          Search…
        </span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium select-none sm:inline-flex">
          <CommandShortcut />
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
      >
        <Search />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command palette"
        description="Search pages and courses"
      >
        <CommandInput
          placeholder="Search pages, courses…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searching ? "Searching…" : "No results found."}
          </CommandEmpty>

          {remoteResults.length > 0 ? (
            <>
              <CommandGroup heading="Courses">
                {remoteResults.map((item) => (
                  <StaticItem
                    key={item.href}
                    icon={item.icon}
                    title={item.title}
                    keywords={item.keywords}
                    onSelect={() => run(item.href)}
                  />
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          ) : null}

          {grouped.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <StaticItem
                  key={item.href}
                  icon={item.icon}
                  title={item.title}
                  keywords={item.keywords}
                  onSelect={() => run(item.href)}
                />
              ))}
            </CommandGroup>
          ))}

          <CommandSeparator />
          <CommandGroup heading="Appearance">
            {themeActions.map((action) => (
              <StaticItem
                key={action.value}
                icon={action.icon}
                title={action.title}
                keywords={action.keywords}
                onSelect={() => applyTheme(action.value)}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
