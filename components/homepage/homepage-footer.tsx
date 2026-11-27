import Link from "next/link"
import { Separator } from "@/components/ui/separator"

/**
 * Marketing footer.
 *
 * The previous version linked to /changelog, /about, /blog, /careers,
 * /contact, /docs, /help, /community, /api-reference and /cookie-policy —
 * none of those routes exist, so ten of the fourteen links 404'd. It also
 * pointed at twitter.com/lmsio, github.com/lmsio and
 * linkedin.com/company/lmsio, which are invented URLs.
 *
 * Only routes and in-page sections that actually exist are listed here. When
 * those pages are built, add them back.
 */

const LEARN_LINKS = [
  { label: "Browse courses", href: "/courses" },
  { label: "Course catalogue", href: "/student/courses/catalogue" },
  { label: "What is included", href: "#enterprise" },
  { label: "Pricing", href: "#pricing-info" },
]

const ACCOUNT_LINKS = [
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/register" },
  { label: "Forgot password", href: "/forgot-password" },
]

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
]

const LINK_GROUPS = [
  { title: "Learn", links: LEARN_LINKS },
  { title: "Account", links: ACCOUNT_LINKS },
  { title: "Legal", links: LEGAL_LINKS },
]

export function HomepageFooter() {
  return (
    <footer className="bg-background">
      <Separator />
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:gap-16">
          <div className="min-w-0 md:w-64">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <span className="text-xs font-medium">L</span>
              </span>
              <span className="text-lg tracking-tight text-foreground">
                LMSio
              </span>
            </Link>
            <p className="mt-3 max-w-60 text-sm leading-relaxed text-muted-foreground">
              Create courses, sell them, and track progress through to
              completion.
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              Seeded demo accounts for each role are listed on the{" "}
              <Link
                href="#try-it"
                className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                try it
              </Link>{" "}
              section.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid min-w-0 flex-1 grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.title} className="min-w-0">
                <h2 className="mb-3 text-[13px] font-medium text-foreground">
                  {group.title}
                </h2>
                <ul className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Separator className="mt-10" />
        <p className="pt-6 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LMSio
        </p>
      </div>
    </footer>
  )
}
