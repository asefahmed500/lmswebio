import { SynexNavbar } from "@/components/synex/Navbar"
import { HomepageFooter } from "@/components/homepage/homepage-footer"

export const metadata = {
  title: "Terms of Service — LMSio",
  description: "LMSio terms of service — the rules and guidelines for using our platform.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <SynexNavbar />

      <main id="main-content" className="mx-auto max-w-[720px] px-5 py-20">
        <h1 className="font-visueltpro text-3xl font-semibold tracking-tight text-void-black">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-smoke">
          Last updated: June 10, 2026
        </p>

        <article className="prose prose-gray mt-10 max-w-none font-visueltpro text-sm leading-[1.8] text-graphite">
          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using LMSio (&quot;the Platform&quot;), you agree
              to be bound by these Terms of Service. If you do not agree, please
              do not use the Platform.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              2. Account Registration
            </h2>
            <p>
              You must provide accurate, complete information when creating an
              account. You are responsible for maintaining the confidentiality of
              your credentials and for all activity under your account. You must
              notify us immediately of any unauthorized use.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              3. Use of the Platform
            </h2>
            <p>You agree not to:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                Share, redistribute, or resell course content without
                authorization
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Platform
              </li>
              <li>Use automated tools to scrape or download content at scale</li>
              <li>
                Upload malicious code, viruses, or content that infringes
                intellectual property
              </li>
              <li>Impersonate another person or entity</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              4. Course Content & Intellectual Property
            </h2>
            <p>
              All course content, including videos, text, images, and
              downloadable materials, is the intellectual property of LMSio or
              its instructors. Your enrollment grants you a limited,
              non-transferable license to access the content for personal,
              non-commercial use.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              5. Payments & Refunds
            </h2>
            <p>
              Paid courses are processed securely through our payment provider.
              Refund requests must be submitted within 7 days of purchase if you
              have completed less than 25% of the course content. Refunds are
              processed to the original payment method within 5–10 business days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              6. Certificates
            </h2>
            <p>
              Certificates of completion are issued when all required lessons and
              assessments are completed. Certificates are for personal
              achievement and do not constitute formal academic credit unless
              stated otherwise.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              7. Termination
            </h2>
            <p>
              We may suspend or terminate your account if you violate these
              Terms. You may delete your account at any time from your profile
              settings. Upon termination, your right to access purchased content
              ceases immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              8. Limitation of Liability
            </h2>
            <p>
              LMSio is provided &quot;as is&quot; without warranties of any kind.
              We shall not be liable for any indirect, incidental, or
              consequential damages arising from your use of the Platform. Our
              total liability shall not exceed the amount you paid in the 12
              months preceding the claim.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              9. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which
              LMSio operates. Any disputes shall be resolved in the courts of
              that jurisdiction.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              10. Changes to These Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Material
              changes will be communicated via email or a prominent notice on the
              Platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              11. Contact
            </h2>
            <p>
              For questions about these Terms, please contact us at{" "}
              <a
                href="mailto:support@lmsio.com"
                className="text-void-black underline"
              >
                support@lmsio.com
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <HomepageFooter />
    </div>
  )
}
