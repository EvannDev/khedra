import { auth } from "@/auth"
import { RiTimeLine } from "@remixicon/react"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your workspace is ready.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <RiTimeLine className="size-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Phase 1 Coming Soon</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Team management, shift scheduling, and constraint-based planning will appear here.
        </p>
      </div>
    </div>
  )
}
