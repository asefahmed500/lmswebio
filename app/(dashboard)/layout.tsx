import { DashboardLayoutShell } from "@/components/dashboard/layout/dashboard-layout"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <DashboardLayoutShell>{children}</DashboardLayoutShell>
    </ErrorBoundary>
  )
}
