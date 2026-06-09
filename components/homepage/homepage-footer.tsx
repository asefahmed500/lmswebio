import Link from "next/link"

const productLinks = [
  { label: "Browse Courses", href: "/courses" },
  { label: "Pricing", href: "#pricing-info" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Changelog", href: "#" },
]

const companyLinks = [
  { label: "About", href: "#about" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#" },
]

const resourceLinks = [
  { label: "Documentation", href: "#" },
  { label: "Help Center", href: "#" },
  { label: "Community", href: "#" },
  { label: "API Reference", href: "#" },
]

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "#" },
]

const linkGroups = [
  { title: "Product", links: productLinks },
  { title: "Company", links: companyLinks },
  { title: "Resources", links: resourceLinks },
  { title: "Legal", links: legalLinks },
]

export function HomepageFooter() {
  return (
    <footer className="border-t border-graphite/10 bg-canvas">
      <div className="mx-auto max-w-[1280px] px-5 py-16">
        <div className="flex flex-col gap-12 md:flex-row md:gap-16">
          {/* Logo + tagline */}
          <div className="md:w-[220px]">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-sm bg-void-black">
                <span className="font-visueltpro text-xs font-bold text-chalk">
                  L
                </span>
              </div>
              <span className="font-visueltpro text-lg font-normal tracking-[-0.02em] text-void-black">
                LMSio
              </span>
            </Link>
            <p className="mt-4 max-w-[200px] font-visueltpro text-sm leading-[1.6] font-light text-smoke">
              The modern learning platform for curious minds.
            </p>
          </div>

          {/* Sitemap columns */}
          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-4 font-visueltpro text-xs font-medium tracking-[0.08em] text-void-black uppercase">
                  {group.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="font-visueltpro text-sm font-light text-smoke transition-colors hover:text-void-black"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-graphite/10 pt-6 sm:flex-row">
          <p className="font-visueltpro text-xs font-light text-smoke">
            &copy; {new Date().getFullYear()} LMSio. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Twitter", "GitHub", "LinkedIn"].map((s) => (
              <Link
                key={s}
                href="#"
                className="font-visueltpro text-xs font-light text-smoke transition-colors hover:text-void-black"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
