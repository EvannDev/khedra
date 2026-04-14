import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { RiArrowLeftLine, RiCalendarLine, RiTimeLine } from "@remixicon/react"
import { planningStatusVariant } from "@/lib/planning-utils"
import { pluralize } from "@/lib/utils"
import { CONSTRAINT_TYPE_LABELS } from "@/lib/constraint-utils"
import type { ConstraintType } from "@/lib/generated/prisma/enums"
import { ConstraintList } from "@/components/teams/constraint-list"
import { TeamConstraintSection } from "@/components/teams/team-constraint-section"
import { SolutionView } from "@/components/teams/solution-view"

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
      _count: { select: { solutions: true } },
    },
  })

  if (!planning) notFound()

  const [constraints, teamConstraints, employees, shiftTypes, latestSolution] = await Promise.all([
    prisma.constraint.findMany({
      where: { planningId },
    }),
    prisma.constraint.findMany({
      where: { teamId: id, planningId: null },
    }),
    prisma.employee.findMany({
      where: { teamId: id },
      select: { id: true, name: true, skills: true },
      orderBy: { name: "asc" },
    }),
    prisma.shiftType.findMany({
      where: { teamId: id },
      select: { id: true, name: true, color: true, startTime: true, endTime: true },
      orderBy: { name: "asc" },
    }),
    prisma.solution.findFirst({
      where: { planningId },
      orderBy: { createdAt: "desc" },
      include: { assignments: true },
    }),
  ])

  constraints.sort((a, b) =>
    CONSTRAINT_TYPE_LABELS[a.type as ConstraintType].localeCompare(
      CONSTRAINT_TYPE_LABELS[b.type as ConstraintType]
    )
  )

  const durationDays = Math.round(
    (planning.endDate.getTime() - planning.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">{planning.name}</h2>
          <Badge variant={planningStatusVariant[planning.status] ?? "secondary"}>
            {planning.status}
          </Badge>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <div className="flex items-center gap-1.5 mb-2">
            <RiCalendarLine className="size-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Start date</p>
          </div>
          <p className="text-sm font-medium">{formatDate(planning.startDate)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <div className="flex items-center gap-1.5 mb-2">
            <RiCalendarLine className="size-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">End date</p>
          </div>
          <p className="text-sm font-medium">{formatDate(planning.endDate)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <div className="flex items-center gap-1.5 mb-2">
            <RiTimeLine className="size-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
          </div>
          <p className="text-sm font-medium">{pluralize(durationDays, "day")}</p>
        </div>
      </div>

      {/* Team-level constraints (read-only) */}
      <TeamConstraintSection
        teamId={id}
        constraints={teamConstraints}
        employees={employees}
        shiftTypes={shiftTypes}
      />

      {/* Planning-specific constraints */}
      <ConstraintList
        teamId={id}
        planningId={planningId}
        constraints={constraints}
        employees={employees}
        shiftTypes={shiftTypes}
      />

      {/* Solver */}
      <SolutionView
        teamId={id}
        planningId={planningId}
        planning={planning}
        employees={employees}
        shiftTypes={shiftTypes}
        latestSolution={latestSolution}
        constraints={[...teamConstraints, ...constraints]}
      />
    </div>
  )
}
