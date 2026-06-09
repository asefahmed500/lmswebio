"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Menu,
  BookOpen,
  GraduationCap,
  DollarSign,
  ArrowRight,
  Users,
  Layers,
  Shield,
  Target,
  Zap,
} from "lucide-react"
import { LMSioLogo } from "@/components/homepage/lmsio-logo"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

const coursesItems = [
  {
    title: "Web Development",
    href: "/courses?category=Web+Development",
    desc: "HTML, CSS, JS, React, Node.js",
  },
  {
    title: "Data Science",
    href: "/courses?category=Data+Science",
    desc: "Python, ML, TensorFlow, D3.js",
  },
  {
    title: "Cloud Computing",
    href: "/courses?category=Cloud+Computing",
    desc: "AWS, K8s, Docker, DevOps",
  },
  {
    title: "Mobile Development",
    href: "/courses?category=Mobile+Development",
    desc: "React Native, Flutter, iOS",
  },
  {
    title: "Cybersecurity",
    href: "/courses?category=Cybersecurity",
    desc: "Security, ethical hacking",
  },
  {
    title: "Business & Marketing",
    href: "/courses?category=Business",
    desc: "Product, agile, marketing",
  },
]

const resourcesItems = [
  {
    title: "Learning Paths",
    href: "/courses",
    desc: "Curated learning journeys",
  },
  {
    title: "Certificates",
    href: "/courses",
    desc: "Earn verified credentials",
  },
  {
    title: "For Instructors",
    href: "#instructors",
    desc: "Create and sell courses",
  },
  { title: "Browse All", href: "/courses", desc: "Explore all courses" },
]

export function HomepageNavbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const { isAuthenticated, user, logout } = useAuth()

  function getDashboardHref(): string {
    if (!user) return "/login"
    switch (user.role) {
      case "ADMIN":
        return "/admin"
      case "INSTRUCTOR":
        return "/instructor"
      case "STUDENT":
        return "/student"
      default:
        return "/login"
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <LMSioLogo />

            <nav className="hidden items-center lg:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 text-sm">
                      <BookOpen className="mr-1.5 size-4" />
                      Courses
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[500px] grid-cols-2 gap-2 p-4">
                        {coursesItems.map((item) => (
                          <Link
                            key={item.title}
                            href={item.href}
                            className="rounded-lg p-3 transition-colors select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm leading-none font-medium">
                              {item.title}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.desc}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 text-sm">
                      <Layers className="mr-1.5 size-4" />
                      Resources
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[280px] p-3">
                        {resourcesItems.map((item) => (
                          <Link
                            key={item.title}
                            href={item.href}
                            className="flex items-start gap-3 rounded-lg p-3 transition-colors select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div>
                              <div className="text-sm leading-none font-medium">
                                {item.title}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink
                      href="#pricing-info"
                      className="group inline-flex h-9 w-max items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <DollarSign className="size-4" />
                      Pricing
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={getDashboardHref()}>Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Sign In
                </Link>
                <Button asChild size="sm">
                  <Link href="/register">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated ? (
              <Button asChild variant="outline" size="sm">
                <Link href={getDashboardHref()}>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            )}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="size-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader className="mb-6">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-2">
                  <div className="mb-3">
                    <p className="mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Courses
                    </p>
                    {coursesItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-muted"
                      >
                        <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="my-2 border-t" />

                  <div className="mb-3">
                    <p className="mb-2 px-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Resources
                    </p>
                    {resourcesItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-muted"
                      >
                        <Layers className="size-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="my-2 border-t" />

                  {isAuthenticated ? (
                    <>
                      <Button
                        asChild
                        className="w-full"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href={getDashboardHref()}>Go to Dashboard</Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          logout()
                          setIsOpen(false)
                        }}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted"
                      >
                        <span className="font-medium">Sign In</span>
                      </Link>
                      <Button
                        asChild
                        className="w-full"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/register">
                          Get Started Free{" "}
                          <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
