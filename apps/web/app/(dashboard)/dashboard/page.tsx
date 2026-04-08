import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { RiTeamLine, RiAddLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { pluralize } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session!.user!.id },
    include: {
      team: {
        include: { _count: { select: { employees: true, plannings: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your teams and schedules.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teams/new">
            <RiAddLine className="size-4" />
            New team
          </Link>
        </Button>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <RiTeamLine className="size-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">No teams yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Create your first team to start adding employees and planning shifts.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/teams/new">
              <RiAddLine className="size-4" />
              Create a team
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ team, role }) => (
            <Link
              key={team.id}
              href={`/dashboard/teams/${team.id}/employees`}
              className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <RiTeamLine className="size-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground capitalize">{role}</span>
              </div>
              <h3 className="mt-4 font-semibold">{team.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {pluralize(team._count.employees, "employee")} ·{" "}
                {pluralize(team._count.plannings, "planning")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
