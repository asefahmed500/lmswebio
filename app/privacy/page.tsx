import { SynexNavbar } from "@/components/synex/Navbar"
import { HomepageFooter } from "@/components/homepage/homepage-footer"

export const metadata = {
  title: "Privacy Policy — LMSio",
  description: "LMSio privacy policy — how we collect, use, and protect your data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <SynexNavbar />

      <main id="main-content" className="mx-auto max-w-[720px] px-5 py-20">
        <h1 className="font-visueltpro text-3xl font-semibold tracking-tight text-void-black">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-smoke">
          Last updated: June 10, 2026
        </p>

        <article className="prose prose-gray mt-10 max-w-none font-visueltpro text-sm leading-[1.8] text-graphite">
          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly, such as your name,
              email address, and payment details when you create an account or
              enroll in a course. We also collect usage data — pages visited,
              lessons completed, and time spent — to improve the learning
              experience.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              2. How We Use Your Information
            </h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>To provide and personalize our educational services</li>
              <li>To process enrollments and payments securely</li>
              <li>To send course updates, recommendations, and support messages</li>
              <li>
                To analyze platform usage and improve content and features
              </li>
              <li>To ensure platform security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              3. Data Sharing
            </h2>
            <p>
              We do not sell your personal information. We share data only with
              service providers essential to running the platform (payment
              processors, email delivery, hosting) and when required by law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              4. Cookies & Tracking
            </h2>
            <p>
              We use essential cookies for authentication and session management.
              Analytics cookies help us understand how the platform is used. You
              can disable non-essential cookies in your browser settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              5. Data Security
            </h2>
            <p>
              We use industry-standard encryption (TLS 1.3) for data in transit
              and encrypt sensitive data at rest. Passwords are hashed using
              bcrypt and never stored in plain text.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              6. Your Rights
            </h2>
            <p>
              You may request access to, correction of, or deletion of your
              personal data at any time by contacting us. If you are in the EU or
              UK, you have additional rights under GDPR including data
              portability and the right to object to processing.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              7. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account is active.
              If you delete your account, we will remove personal data within 30
              days, except where retention is required by law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              8. Children&apos;s Privacy
            </h2>
            <p>
              LMSio is not intended for children under 13. We do not knowingly
              collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will notify
              you of any material changes by posting the updated policy on this
              page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-void-black">
              10. Contact Us
            </h2>
            <p>
              If you have questions about this privacy policy, please contact us
              at{" "}
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
