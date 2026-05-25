import Link from "next/link"
import {
  BookOpen,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              L
            </div>
            <span>LMS Platform</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            Trusted by 10,000+ learners worldwide
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Learn Without
            <span className="text-primary"> Limits</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            A modern learning management system built for educators and
            students. Create courses, track progress, and achieve your learning
            goals — all in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full text-base sm:w-auto">
              <Link href="/register">
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full text-base sm:w-auto"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to teach and learn
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our platform provides all the tools educators need to create
              engaging courses and students need to succeed.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Course Management</h3>
              <p className="text-sm text-muted-foreground">
                Create and organize courses with modules, lessons, videos, and
                PDFs.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Student Enrolment</h3>
              <p className="text-sm text-muted-foreground">
                Students can browse and enrol in courses with self-enrolment or
                approval.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Progress Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track student progress, completion rates, and performance
                analytics.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Role-Based Access</h3>
              <p className="text-sm text-muted-foreground">
                Admin, Instructor, and Student roles with granular permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold">Create Your Account</h3>
                <p className="mt-1 text-muted-foreground">
                  Sign up as a student or instructor. Admins can manage the
                  entire platform.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Create or Enrol in Courses
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Instructors build courses with rich content. Students browse
                  and enrol in one click.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Learn and Track Progress
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Complete lessons, take quizzes, submit assignments, and track
                  your learning journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start learning?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Join thousands of students and instructors already using our
            platform to teach and learn.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                L
              </div>
              LMS Platform &copy; {new Date().getFullYear()}
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link
                href="/login"
                className="transition-colors hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="transition-colors hover:text-foreground"
              >
                Register
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
