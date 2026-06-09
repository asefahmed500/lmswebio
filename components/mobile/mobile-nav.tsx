"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  BookOpen,
  FileText,
  Award,
  Calendar,
  Users,
  Settings,
  Menu,
  X,
  BarChart3,
  ClipboardCheck,
  Edit3,
  GraduationCap,
  LayoutDashboard,
  Trophy,
  ChevronRight,
  LogOut,
  Bell,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  items?: NavItem[]
}

const roleNavMap: Record<string, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
      items: [
        { href: "/admin/users", label: "All Users", icon: Users },
        { href: "/admin/users/instructors", label: "Instructors", icon: Users },
        { href: "/admin/users/students", label: "Students", icon: Users },
        { href: "/admin/users/new", label: "Add User", icon: Users },
      ],
    },
    {
      href: "/admin/courses",
      label: "Courses",
      icon: BookOpen,
      items: [
        { href: "/admin/courses", label: "All Courses", icon: BookOpen },
        {
          href: "/admin/courses/pending",
          label: "Pending Approval",
          icon: BookOpen,
        },
        {
          href: "/admin/courses/categories",
          label: "Categories",
          icon: BookOpen,
        },
        { href: "/admin/courses/new", label: "Add Course", icon: BookOpen },
      ],
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: BarChart3,
      items: [
        {
          href: "/admin/analytics",
          label: "Platform Reports",
          icon: BarChart3,
        },
        {
          href: "/admin/analytics/enrollments",
          label: "Enrollment Trends",
          icon: BarChart3,
        },
      ],
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      items: [
        { href: "/admin/settings", label: "General", icon: Settings },
        { href: "/admin/settings/email", label: "Email", icon: Settings },
        {
          href: "/admin/settings/integrations",
          label: "Integrations",
          icon: Settings,
        },
      ],
    },
  ],
  INSTRUCTOR: [
    { href: "/instructor", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/instructor/courses",
      label: "Courses",
      icon: BookOpen,
      items: [
        { href: "/instructor/courses", label: "My Courses", icon: BookOpen },
        {
          href: "/instructor/courses/new",
          label: "Create New",
          icon: BookOpen,
        },
        { href: "/instructor/courses/drafts", label: "Drafts", icon: BookOpen },
      ],
    },
    {
      href: "/instructor/assignments",
      label: "Assignments",
      icon: Edit3,
      items: [
        {
          href: "/instructor/assignments/grading",
          label: "To Grade",
          icon: Edit3,
        },
        {
          href: "/instructor/assignments/submissions",
          label: "All Submissions",
          icon: Edit3,
        },
        {
          href: "/instructor/assignments/new",
          label: "Create Assignment",
          icon: Edit3,
        },
      ],
    },
    {
      href: "/instructor/quizzes",
      label: "Quizzes",
      icon: ClipboardCheck,
      items: [
        {
          href: "/instructor/quizzes",
          label: "Manage Quizzes",
          icon: ClipboardCheck,
        },
        {
          href: "/instructor/quizzes/new",
          label: "Create Quiz",
          icon: ClipboardCheck,
        },
        {
          href: "/instructor/quizzes/results",
          label: "Results",
          icon: ClipboardCheck,
        },
      ],
    },
    {
      href: "/instructor/analytics",
      label: "Analytics",
      icon: BarChart3,
      items: [
        {
          href: "/instructor/analytics",
          label: "Course Progress",
          icon: BarChart3,
        },
        {
          href: "/instructor/analytics/students",
          label: "Student Performance",
          icon: BarChart3,
        },
      ],
    },
  ],
  STUDENT: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/student/my-learning",
      label: "My Learning",
      icon: GraduationCap,
      items: [
        {
          href: "/student/my-learning/enrolled",
          label: "Enrolled Courses",
          icon: GraduationCap,
        },
        {
          href: "/student/courses/catalogue",
          label: "Course Catalogue",
          icon: GraduationCap,
        },
        {
          href: "/student/my-learning/continue",
          label: "Continue Learning",
          icon: GraduationCap,
        },
      ],
    },
    {
      href: "/student/assignments",
      label: "Assignments",
      icon: Edit3,
      items: [
        { href: "/student/assignments/pending", label: "Pending", icon: Edit3 },
        {
          href: "/student/assignments/submitted",
          label: "Submitted",
          icon: Edit3,
        },
        { href: "/student/assignments/graded", label: "Graded", icon: Edit3 },
      ],
    },
    {
      href: "/student/quizzes",
      label: "Quizzes",
      icon: ClipboardCheck,
      items: [
        {
          href: "/student/quizzes/upcoming",
          label: "Upcoming",
          icon: ClipboardCheck,
        },
        {
          href: "/student/quizzes/completed",
          label: "Completed",
          icon: ClipboardCheck,
        },
      ],
    },
    {
      href: "/student/achievements",
      label: "Achievements",
      icon: Trophy,
      items: [
        { href: "/student/certificates", label: "Certificates", icon: Trophy },
        { href: "/student/achievements/badges", label: "Badges", icon: Trophy },
        {
          href: "/student/achievements/progress",
          label: "Progress",
          icon: Trophy,
        },
      ],
    },
  ],
}

interface MobileNavProps {
  userRole?: Role
  user?: {
    fullName?: string
    avatarUrl?: string | null
  }
  onLogout?: () => void
}

function CollapsibleNavItem({
  item,
  pathname,
  onClose,
}: {
  item: NavItem
  pathname: string
  onClose: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const hasActiveChild =
    item.items?.some((sub) => sub.href === pathname) ?? false

  if (!item.items || item.items.length === 0) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
          pathname === item.href
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="size-5 shrink-0" />
        <span className="font-medium">{item.label}</span>
      </Link>
    )
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-auto w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
          hasActiveChild
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="size-5 shrink-0" />
        <span className="flex-1 font-medium">{item.label}</span>
        <ChevronRight
          className={cn(
            "size-4 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </Button>
      {isOpen && (
        <div className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-border pl-3">
          {item.items.map((sub) => (
            <Link
              key={sub.href}
              href={sub.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                pathname === sub.href
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="font-medium">{sub.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function MobileNav({ userRole, user, onLogout }: MobileNavProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const navItems = roleNavMap[userRole || "STUDENT"] || roleNavMap.STUDENT

  return (
    <>
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-background md:hidden">
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive =
              pathname === item.href ||
              item.items?.some((sub) => sub.href === pathname)
            return (
              <Link
                key={item.href}
                href={item.items ? item.items[0].href : item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 rounded-md px-3 py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="size-5" />
                <span className="truncate text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            )
          })}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-10 w-10"
            aria-label="Open navigation menu"
          >
            <Menu />
          </Button>
        </nav>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {userRole?.toLowerCase()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
              >
                <X />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex flex-col gap-1 px-2">
                <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Menu
                </p>
                {navItems.map((item) => (
                  <CollapsibleNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-4">
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onLogout?.()
                  setIsOpen(false)
                }}
              >
                <LogOut className="size-5" />
                <span className="font-medium">Log out</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
