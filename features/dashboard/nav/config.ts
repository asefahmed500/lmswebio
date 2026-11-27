import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Bell,
  BookOpen,
  BookPlus,
  CalendarDays,
  CircleCheck,
  ClipboardCheck,
  ClipboardPlus,
  FilePlus2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  NotebookPen,
  Plus,
  Route,
  Settings,
  Tags,
  Trophy,
  User,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react"
import type { Role } from "@/types"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** Rendered as a count pill. Omit for none. */
  badge?: number
  /** Extra terms for the command palette to match against. */
  keywords?: string[]
}

export type NavSection = {
  /** Section heading. Also used as the command-palette group label. */
  title: string
  icon: LucideIcon
  items: NavItem[]
}

export type NavConfig = {
  /** Ungrouped, always visible at the top of the sidebar. */
  primary: NavItem[]
  /** Collapsible groups. */
  sections: NavSection[]
  /** Pinned to the bottom, above the account footer. */
  secondary: NavItem[]
}

const dashboard = (base: string): NavItem => ({
  title: "Dashboard",
  href: base,
  icon: LayoutDashboard,
  keywords: ["home", "overview", "start"],
})

export const NAV_CONFIG: Record<Role, NavConfig> = {
  ADMIN: {
    primary: [dashboard("/admin")],
    sections: [
      {
        title: "People",
        icon: Users,
        items: [
          {
            title: "All Users",
            href: "/admin/users",
            icon: Users,
            keywords: ["directory", "accounts", "members"],
          },
          {
            title: "Instructors",
            href: "/admin/users/instructors",
            icon: GraduationCap,
            keywords: ["teachers", "creators", "sellers"],
          },
          {
            title: "Students",
            href: "/admin/users/students",
            icon: User,
            keywords: ["learners", "buyers"],
          },
          {
            title: "Add User",
            href: "/admin/users/new",
            icon: UserPlus,
            keywords: ["invite", "create"],
          },
        ],
      },
      {
        title: "Catalogue",
        icon: BookOpen,
        items: [
          {
            title: "All Courses",
            href: "/admin/courses",
            icon: BookOpen,
            keywords: ["products", "inventory"],
          },
          {
            title: "Pending Approval",
            href: "/admin/courses/pending",
            icon: FileText,
            keywords: ["review", "moderation", "queue"],
          },
          {
            title: "Categories",
            href: "/admin/courses/categories",
            icon: Tags,
            keywords: ["taxonomy", "tags"],
          },
          {
            title: "Add Course",
            href: "/admin/courses/new",
            icon: BookPlus,
            keywords: ["create", "publish", "new product"],
          },
        ],
      },
      {
        title: "Assessments",
        icon: FileText,
        items: [
          {
            title: "All Quizzes",
            href: "/admin/quizzes",
            icon: ClipboardCheck,
            keywords: ["tests", "assessments"],
          },
          {
            title: "Question Bank",
            href: "/admin/quizzes/question-bank",
            icon: FileText,
            keywords: ["pool", "reusable"],
          },
        ],
      },
      {
        title: "Insights",
        icon: BarChart3,
        items: [
          {
            title: "Platform Reports",
            href: "/admin/analytics",
            icon: BarChart3,
            keywords: ["metrics", "kpi", "dashboard data"],
          },
          {
            title: "Enrollment Trends",
            href: "/admin/analytics/enrollments",
            icon: BarChart3,
            keywords: ["growth", "conversion", "sales"],
          },
        ],
      },
      {
        title: "Configuration",
        icon: Settings,
        items: [
          {
            title: "General",
            href: "/admin/settings",
            icon: Settings,
            keywords: ["site", "platform"],
          },
          {
            title: "Email",
            href: "/admin/settings/email",
            icon: Settings,
            keywords: ["smtp", "mail", "notifications"],
          },
          {
            title: "Integrations",
            href: "/admin/settings/integrations",
            icon: Settings,
            keywords: ["stripe", "payments", "webhooks"],
          },
        ],
      },
    ],
    secondary: [
      {
        title: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        keywords: ["alerts", "inbox"],
      },
      {
        title: "Profile",
        href: "/admin/profile",
        icon: User,
        keywords: ["account"],
      },
    ],
  },

  INSTRUCTOR: {
    primary: [dashboard("/instructor")],
    sections: [
      {
        title: "My Courses",
        icon: BookOpen,
        items: [
          {
            title: "My Courses",
            href: "/instructor/courses",
            icon: BookOpen,
            keywords: ["products", "catalog", "my shop"],
          },
          {
            title: "Create New",
            href: "/instructor/courses/new",
            icon: Plus,
            keywords: ["add", "new course", "sell", "product"],
          },
          {
            title: "Drafts",
            href: "/instructor/courses/drafts",
            icon: FileText,
            keywords: ["unpublished", "wip"],
          },
        ],
      },
      {
        title: "Grading",
        icon: ClipboardCheck,
        items: [
          {
            title: "To Grade",
            href: "/instructor/assignments/grading",
            icon: ClipboardCheck,
            keywords: ["queue", "submissions", "pending", "marking"],
          },
          {
            title: "All Submissions",
            href: "/instructor/assignments/submissions",
            icon: FileText,
            keywords: ["homework", "answers"],
          },
          {
            title: "Create Assignment",
            href: "/instructor/assignments/new",
            icon: ClipboardPlus,
            keywords: ["add", "homework"],
          },
        ],
      },
      {
        title: "Quizzes",
        icon: ClipboardCheck,
        items: [
          {
            title: "Manage Quizzes",
            href: "/instructor/quizzes",
            icon: ClipboardCheck,
            keywords: ["tests", "assessments"],
          },
          {
            title: "Create Quiz",
            href: "/instructor/quizzes/new",
            icon: FilePlus2,
            keywords: ["add", "new test"],
          },
          {
            title: "Results",
            href: "/instructor/quizzes/results",
            icon: CircleCheck,
            keywords: ["scores", "grades", "attempts"],
          },
        ],
      },
      {
        title: "Insights",
        icon: BarChart3,
        items: [
          {
            title: "Course Progress",
            href: "/instructor/analytics",
            icon: BarChart3,
            keywords: ["metrics", "engagement"],
          },
          {
            title: "Student Performance",
            href: "/instructor/analytics/students",
            icon: Users,
            keywords: ["learners", "retention", "completion"],
          },
        ],
      },
    ],
    secondary: [
      {
        title: "Notifications",
        href: "/instructor/notifications",
        icon: Bell,
        keywords: ["alerts", "inbox"],
      },
      {
        title: "Profile",
        href: "/instructor/profile",
        icon: User,
        keywords: ["account", "bio", "public page"],
      },
    ],
  },

  STUDENT: {
    primary: [dashboard("/student")],
    sections: [
      {
        title: "My Learning",
        icon: GraduationCap,
        items: [
          {
            title: "Enrolled Courses",
            href: "/student/my-learning/enrolled",
            icon: GraduationCap,
            keywords: ["my courses", "purchased", "bought"],
          },
          {
            title: "Course Catalogue",
            href: "/student/courses/catalogue",
            icon: BookOpen,
            keywords: ["browse", "shop", "store", "discover", "buy"],
          },
          {
            title: "Continue Learning",
            href: "/student/my-learning/continue",
            icon: BookOpen,
            keywords: ["resume", "pick up", "in progress"],
          },
        ],
      },
      {
        title: "Assignments",
        icon: NotebookPen,
        items: [
          {
            title: "Pending",
            href: "/student/assignments/pending",
            icon: NotebookPen,
            keywords: ["todo", "due", "to do"],
          },
          {
            title: "Submitted",
            href: "/student/assignments/submitted",
            icon: FileText,
            keywords: ["sent", "handed in"],
          },
          {
            title: "Graded",
            href: "/student/assignments/graded",
            icon: CircleCheck,
            keywords: ["feedback", "marked", "results"],
          },
        ],
      },
      {
        title: "Quizzes",
        icon: ClipboardCheck,
        items: [
          {
            title: "Upcoming",
            href: "/student/quizzes/upcoming",
            icon: ClipboardCheck,
            keywords: ["scheduled", "next"],
          },
          {
            title: "Completed",
            href: "/student/quizzes/completed",
            icon: CircleCheck,
            keywords: ["scores", "past", "history"],
          },
        ],
      },
      {
        title: "Achievements",
        icon: Trophy,
        items: [
          {
            title: "Certificates",
            href: "/student/certificates",
            icon: GraduationCap,
            keywords: ["credential", "diploma", "proof"],
          },
          {
            title: "Badges",
            href: "/student/achievements/badges",
            icon: Trophy,
            keywords: ["awards", "medals"],
          },
          {
            title: "Progress",
            href: "/student/achievements/progress",
            icon: BarChart3,
            keywords: ["stats", "completion", "levels"],
          },
        ],
      },
      {
        title: "Community",
        icon: MessageCircle,
        items: [
          {
            title: "Discussions",
            href: "/student/discussions",
            icon: MessageCircle,
            keywords: ["forum", "questions", "qa"],
          },
          {
            title: "Learning Paths",
            href: "/student/learning-paths",
            icon: Route,
            keywords: ["curriculum", "track", "programme"],
          },
        ],
      },
      {
        title: "Tools",
        icon: Wrench,
        items: [
          {
            title: "Notes",
            href: "/student/notes",
            icon: NotebookPen,
            keywords: ["notebook", "scratchpad"],
          },
          {
            title: "Calendar",
            href: "/student/calendar",
            icon: CalendarDays,
            keywords: ["schedule", "events", "deadlines", "rsvp"],
          },
        ],
      },
    ],
    secondary: [
      {
        title: "Notifications",
        href: "/student/notifications",
        icon: Bell,
        keywords: ["alerts", "inbox"],
      },
      {
        title: "Profile",
        href: "/student/profile",
        icon: User,
        keywords: ["account", "settings"],
      },
    ],
  },
}

/** Every item for a role, flattened. Used by the command palette. */
export function flattenNav(config: NavConfig): NavItem[] {
  return [
    ...config.primary,
    ...config.sections.flatMap((section) => section.items),
    ...config.secondary,
  ]
}

export function getNavConfig(role: Role): NavConfig {
  return NAV_CONFIG[role]
}
