"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Role, SidebarMenuItem } from "@/types"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  BarChart3,
  Settings,
  GraduationCap,
  Edit3,
  ClipboardCheck,
  Trophy,
  ChevronDown,
  Search,
  LogOut,
  Bell,
  User,
  MessageCircle,
  Wrench,
} from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem as UISidebarMenuItem,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarInput,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAuth } from "@/components/auth-provider"

const sidebarConfig: Record<Role, SidebarMenuItem[]> = {
  ADMIN: [
    { title: "Dashboard", icon: "LayoutDashboard", href: "/admin" },
    {
      title: "Users",
      icon: "Users",
      items: [
        { title: "All Users", href: "/admin/users" },
        { title: "Instructors", href: "/admin/users/instructors" },
        { title: "Students", href: "/admin/users/students" },
        { title: "Add User", href: "/admin/users/new" },
      ],
    },
    {
      title: "Courses",
      icon: "BookOpen",
      items: [
        { title: "All Courses", href: "/admin/courses" },
        { title: "Pending Approval", href: "/admin/courses/pending" },
        { title: "Categories", href: "/admin/courses/categories" },
        { title: "Add Course", href: "/admin/courses/new" },
      ],
    },
    {
      title: "Assessments",
      icon: "FileText",
      items: [
        { title: "All Quizzes", href: "/admin/quizzes" },
        { title: "Question Bank", href: "/admin/quizzes/question-bank" },
      ],
    },
    {
      title: "Analytics",
      icon: "BarChart3",
      items: [
        { title: "Platform Reports", href: "/admin/analytics" },
        { title: "Enrollment Trends", href: "/admin/analytics/enrollments" },
      ],
    },
    {
      title: "Settings",
      icon: "Settings",
      items: [
        { title: "General", href: "/admin/settings" },
        { title: "Email", href: "/admin/settings/email" },
        { title: "Integrations", href: "/admin/settings/integrations" },
      ],
    },
    { title: "Notifications", icon: "Bell", href: "/admin/notifications" },
    { title: "Profile", icon: "User", href: "/admin/profile" },
  ],
  INSTRUCTOR: [
    { title: "Dashboard", icon: "LayoutDashboard", href: "/instructor" },
    {
      title: "Courses",
      icon: "BookOpen",
      items: [
        { title: "My Courses", href: "/instructor/courses" },
        { title: "Create New", href: "/instructor/courses/new" },
        { title: "Drafts", href: "/instructor/courses/drafts" },
      ],
    },
    {
      title: "Assignments",
      icon: "Edit3",
      items: [
        { title: "To Grade", href: "/instructor/assignments/grading" },
        {
          title: "All Submissions",
          href: "/instructor/assignments/submissions",
        },
        { title: "Create Assignment", href: "/instructor/assignments/new" },
      ],
    },
    {
      title: "Quizzes",
      icon: "ClipboardCheck",
      items: [
        { title: "Manage Quizzes", href: "/instructor/quizzes" },
        { title: "Create Quiz", href: "/instructor/quizzes/new" },
        { title: "Results", href: "/instructor/quizzes/results" },
      ],
    },
    {
      title: "Analytics",
      icon: "BarChart3",
      items: [
        { title: "Course Progress", href: "/instructor/analytics" },
        {
          title: "Student Performance",
          href: "/instructor/analytics/students",
        },
      ],
    },
    { title: "Notifications", icon: "Bell", href: "/instructor/notifications" },
    { title: "Profile", icon: "User", href: "/instructor/profile" },
  ],
  STUDENT: [
    { title: "Dashboard", icon: "LayoutDashboard", href: "/student" },
    {
      title: "My Learning",
      icon: "GraduationCap",
      items: [
        { title: "Enrolled Courses", href: "/student/my-learning/enrolled" },
        { title: "Course Catalogue", href: "/student/courses/catalogue" },
        { title: "Continue Learning", href: "/student/my-learning/continue" },
      ],
    },
    {
      title: "Assignments",
      icon: "Edit3",
      items: [
        { title: "Pending", href: "/student/assignments/pending" },
        { title: "Submitted", href: "/student/assignments/submitted" },
        { title: "Graded", href: "/student/assignments/graded" },
      ],
    },
    {
      title: "Quizzes",
      icon: "ClipboardCheck",
      items: [
        { title: "Upcoming", href: "/student/quizzes/upcoming" },
        { title: "Completed", href: "/student/quizzes/completed" },
      ],
    },
    {
      title: "Achievements",
      icon: "Trophy",
      items: [
        { title: "Certificates", href: "/student/certificates" },
        { title: "Badges", href: "/student/achievements/badges" },
        { title: "Progress", href: "/student/achievements/progress" },
      ],
    },
    {
      title: "Community",
      icon: "MessageCircle",
      items: [
        { title: "Discussions", href: "/student/discussions" },
        { title: "Learning Paths", href: "/student/learning-paths" },
      ],
    },
    {
      title: "Tools",
      icon: "Wrench",
      items: [
        { title: "Notes", href: "/student/notes" },
        { title: "Calendar", href: "/student/calendar" },
      ],
    },
    { title: "Notifications", icon: "Bell", href: "/student/notifications" },
    { title: "Profile", icon: "User", href: "/student/profile" },
  ],
}

function Icon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Users,
    BookOpen,
    FileText,
    BarChart3,
    Settings,
    GraduationCap,
    Edit3,
    ClipboardCheck,
    Trophy,
    HelpCircle,
    Bell,
    User,
    MessageCircle,
    Wrench,
  }
  const IconComponent = icons[name]
  if (!IconComponent) return <HelpCircle className={className} />
  return <IconComponent className={className} />
}

function MenuItem({
  item,
  isActive,
}: {
  item: SidebarMenuItem
  isActive: boolean
}) {
  const pathname = usePathname()

  const hasActiveSubItem = React.useMemo(() => {
    if (!item.items) return false
    return item.items.some((subItem) => subItem.href === pathname)
  }, [item.items, pathname])

  const [isOpen, setIsOpen] = React.useState(hasActiveSubItem)

  if (!item.items || item.items.length === 0) {
    return (
      <UISidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive || item.href === pathname}
          tooltip={item.title}
        >
          <Link href={item.href ?? "#"}>
            {item.icon && <Icon name={item.icon} />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </UISidebarMenuItem>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <UISidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={hasActiveSubItem}>
            {item.icon && <Icon name={item.icon} />}
            <span className="flex-1">{item.title}</span>
            <SidebarMenuBadge>
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </SidebarMenuBadge>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={subItem.href === pathname}
                >
                  <Link href={subItem.href ?? "#"}>
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </UISidebarMenuItem>
    </Collapsible>
  )
}

function SidebarSearch() {
  const [query, setQuery] = React.useState("")
  const { user } = useAuth()
  const router = React.useMemo(() => {
    return {
      push: (url: string) => {
        window.location.href = url
      },
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const role = user?.role
    if (!role) return
    if (role === "STUDENT") {
      router.push(
        `/student/courses/catalogue?search=${encodeURIComponent(query)}`
      )
    } else if (role === "INSTRUCTOR") {
      router.push(`/instructor/courses?search=${encodeURIComponent(query)}`)
    } else {
      router.push(`/admin/courses?search=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
      <SidebarInput
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-8"
      />
    </form>
  )
}

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const menuItems = sidebarConfig[role] || []
  const { logout } = useAuth()

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          Search
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarSearch />
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      {menuItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <MenuItem
                key={item.title}
                item={item}
                isActive={item.href === pathname}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarMenu>
          <UISidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                logout()
                window.location.href = "/login"
              }}
              tooltip="Log out"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">
                Log out
              </span>
            </SidebarMenuButton>
          </UISidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
