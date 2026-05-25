/**
 * Sidebar navigation component
 * Provides role-based navigation menus with dropdown functionality
 * Uses Lucide React icons and integrates with shadcn/ui sidebar
 */

"use client"

import * as React from "react"
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
} from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem as UISidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

/**
 * Role-based sidebar menu configuration
 * Defines navigation structure for Admin, Instructor, and Student roles
 */
const sidebarConfig: Record<Role, SidebarMenuItem[]> = {
  ADMIN: [
    {
      title: "Dashboard",
      icon: "LayoutDashboard",
      href: "/admin",
    },
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
  ],
  INSTRUCTOR: [
    {
      title: "Dashboard",
      icon: "LayoutDashboard",
      href: "/instructor",
    },
    {
      title: "Courses",
      icon: "BookOpen",
      items: [
        { title: "My Courses", href: "/instructor/courses" },
        { title: "Create New Course", href: "/instructor/courses/new" },
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
  ],
  STUDENT: [
    {
      title: "Dashboard",
      icon: "LayoutDashboard",
      href: "/student",
    },
    {
      title: "My Learning",
      icon: "GraduationCap",
      items: [
        { title: "Enrolled Courses", href: "/student/courses/enrolled" },
        { title: "Course Catalogue", href: "/student/courses/catalogue" },
        { title: "Continue Learning", href: "/student/courses/continue" },
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
        { title: "Certificates", href: "/student/achievements/certificates" },
        { title: "Badges", href: "/student/achievements/badges" },
        { title: "Progress", href: "/student/achievements/progress" },
      ],
    },
  ],
}

/**
 * Icon mapping component
 * Maps icon string names to Lucide React icon components
 */
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
  }

  const IconComponent = icons[name]
  if (!IconComponent) {
    return <HelpCircle className={className} />
  }
  return <IconComponent className={className} />
}

/**
 * Sidebar menu item component
 * Renders either a simple link or a collapsible dropdown with sub-items
 */
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

  // If no sub-items, render simple menu button
  if (!item.items || item.items.length === 0) {
    return (
      <UISidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive || item.href === pathname}
          tooltip={item.title}
        >
          <a href={item.href}>
            {item.icon && <Icon name={item.icon} />}
            <span>{item.title}</span>
          </a>
        </SidebarMenuButton>
      </UISidebarMenuItem>
    )
  }

  // Render collapsible dropdown with sub-items
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <UISidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <Icon name={item.icon} />}
            <span>{item.title}</span>
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
                  <a href={subItem.href}>
                    <span>{subItem.title}</span>
                    {subItem.badge && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {subItem.badge}
                      </span>
                    )}
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </UISidebarMenuItem>
    </Collapsible>
  )
}

/**
 * Main sidebar navigation component
 * Renders the appropriate menu based on user role
 */
export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const menuItems = sidebarConfig[role] || []

  const mainMenu = menuItems
  const hasMenuItems = mainMenu.length > 0

  return (
    <>
      {hasMenuItems && (
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {mainMenu.map((item) => (
              <MenuItem
                key={item.title}
                item={item}
                isActive={item.href === pathname}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  )
}
