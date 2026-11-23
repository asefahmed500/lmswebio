import Link from "next/link"

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
    <footer className="border-t border-graphite/10 bg-canvas">
      <div className="mx-auto max-w-[1280px] px-5 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:gap-16">
          <div className="md:w-[260px]">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-sm bg-void-black">
                <span className="font-visueltpro text-xs font-bold text-chalk">
                  L
                </span>
              </span>
              <span className="font-visueltpro text-lg tracking-[-0.02em] text-void-black">
                LMSio
              </span>
            </Link>
            <p className="mt-3 max-w-[240px] font-visueltpro text-sm leading-[1.6] text-smoke">
              Create courses, sell them, and track progress through to
              completion.
            </p>
            <p className="mt-4 font-visueltpro text-[13px] leading-[1.6] text-smoke">
              Seeded demo accounts for each role are listed on the{" "}
              <Link
                href="#try-it"
                className="text-graphite underline underline-offset-4 hover:text-void-black"
              >
                try it
              </Link>{" "}
              section.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="mb-3 font-visueltpro text-[13px] font-medium text-void-black">
                  {group.title}
                </h2>
                <ul className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="font-visueltpro text-sm text-smoke transition-colors hover:text-void-black"
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

        <div className="mt-10 border-t border-graphite/10 pt-6">
          <p className="font-visueltpro text-xs text-smoke">
            &copy; {new Date().getFullYear()} LMSio
          </p>
        </div>
      </div>
    </footer>
  )
}
