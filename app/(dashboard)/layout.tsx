import { DashboardLayoutShell } from "@/components/dashboard/layout/dashboard-layout"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
            <p className="text-muted-foreground mb-4">
              An error occurred in the dashboard. Please reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Reload
            </button>
          </div>
        </div>
      }
    >
      <DashboardLayoutShell>{children}</DashboardLayoutShell>
    </ErrorBoundary>
  )
}
