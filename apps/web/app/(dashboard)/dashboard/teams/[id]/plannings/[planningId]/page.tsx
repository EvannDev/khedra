import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RiArrowLeftLine, RiCalendarLine, RiSettings4Line, RiFlowChart } from "@remixicon/react"
import { planningStatusVariant } from "@/lib/planning-utils"
import { pluralize } from "@/lib/utils"

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default async function PlanningDetailPage({
  params,
}: {
  params: Promise<{ id: string; planningId: string }>
}) {
  const { id, planningId } = await params

  const planning = await prisma.planning.findUnique({
    where: { id: planningId, teamId: id },
    include: {
      _count: { select: { constraints: true, solutions: true } },
    },
  })

  if (!planning) notFound()

  const durationDays = Math.round(
    (planning.endDate.getTime() - planning.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/dashboard/teams/${id}/plannings`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RiArrowLeftLine className="size-3.5" />
              Plannings
            </Link>
          </div>
          <h2 className="text-xl font-bold tracking-tight">{planning.name}</h2>
        </div>
        <Badge variant={planningStatusVariant[planning.status] ?? "secondary"} className="mt-1">
          {planning.status}
        </Badge>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Start date</p>
          <p className="text-sm font-medium">{formatDate(planning.startDate)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">End date</p>
          <p className="text-sm font-medium">{formatDate(planning.endDate)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Duration</p>
          <p className="text-sm font-medium">{pluralize(durationDays, "day")}</p>
        </div>
      </div>

      {/* Constraints placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <RiSettings4Line className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Constraints</p>
            <p className="text-xs text-muted-foreground">
              {planning._count.constraints > 0
                ? `${pluralize(planning._count.constraints, "constraint")} defined`
                : "No constraints yet"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Constraint management coming in Phase 2.
        </p>
      </div>

      {/* Solver placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <RiFlowChart className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Schedule</p>
            <p className="text-xs text-muted-foreground">
              {planning._count.solutions > 0
                ? `${pluralize(planning._count.solutions, "solution")} generated`
                : "Not solved yet"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Solver integration coming in Phase 3.
        </p>
      </div>
    </div>
  )
}
