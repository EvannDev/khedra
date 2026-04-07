import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { RiCalendarScheduleLine, RiLogoutBoxLine, RiSettings4Line } from "@remixicon/react"
import { getAvatarUrl } from "@/lib/avatar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <RiCalendarScheduleLine className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">khedra</span>
          </Link>
          <div className="flex items-center gap-3">
            <img
              src={getAvatarUrl(session.user.email)}
              alt=""
              className="size-7 rounded-full bg-muted border border-border"
            />
            <span className="text-sm text-muted-foreground">
              {session.user.name ?? session.user.email}
            </span>
            <Link
              href="/dashboard/settings"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Profile settings"
            >
              <RiSettings4Line className="size-4" />
            </Link>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/sign-in" })
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RiLogoutBoxLine className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
