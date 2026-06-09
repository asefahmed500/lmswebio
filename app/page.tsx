import { type Metadata } from "next"
import { HomepageContent } from "@/components/homepage/homepage-content"
import { HomepageFooter } from "@/components/homepage/homepage-footer"
import { SynexHero } from "@/components/synex/Hero"

export const metadata: Metadata = {
  title: "LMSio — A New Standard in Online Learning",
  description:
    "Take full control of your education with a unified platform for learning, tracking, and advancing in your career — in real time.",
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <SynexHero />
      <HomepageContent />
      <HomepageFooter />
    </div>
  )
}
