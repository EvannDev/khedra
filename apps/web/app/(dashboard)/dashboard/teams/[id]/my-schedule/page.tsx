import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RiCalendarLine } from "@remixicon/react"
import { ScheduleViews } from "@/components/teams/schedule-views"

function shiftDurationHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  const startMin = sh * 60 + sm
  let endMin = eh * 60 + em
  if (endMin <= startMin) endMin += 24 * 60
  return (endMin - startMin) / 60
}

export default async function MySchedulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const employee = await prisma.employee.findFirst({
    where: { teamId: id, userId: session!.user!.id },
  })

  if (!employee) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <RiCalendarLine className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Not linked to an employee profile</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask your team admin to link your account to an employee profile to see your schedule.
        </p>
      </div>
    )
  }

  // Find the latest complete solution per planning to avoid duplicates when re-solved
  const latestSolutions = await prisma.solution.findMany({
    where: { status: "complete", planning: { teamId: id } },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    distinct: ["planningId"],
  })
  const latestSolutionIds = latestSolutions.map((s) => s.id)

  const assignments = await prisma.assignment.findMany({
    where: {
      employeeId: employee.id,
      solutionId: { in: latestSolutionIds },
    },
    include: {
      shiftType: true,
      solution: { include: { planning: true } },
    },
    orderBy: { date: "asc" },
  })

  const totalHours = assignments.reduce(
    (sum, a) => sum + shiftDurationHours(a.shiftType.startTime, a.shiftType.endTime),
    0
  )
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activePlannings = new Set(assignments.map((a) => a.solution.planningId)).size

  // Serialize for client component (Dates can't cross RSC boundary)
  const serialized = assignments.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    shiftType: {
      name: a.shiftType.name,
      startTime: a.shiftType.startTime,
      endTime: a.shiftType.endTime,
      color: a.shiftType.color,
    },
    planningName: a.solution.planning.name,
  }))

  const nextAssignment = serialized.find((s) => new Date(s.date) >= today) ?? null

  return (
    <ScheduleViews
      assignments={serialized}
      employeeName={employee.name}
      totalHours={totalHours}
      nextAssignment={nextAssignment}
      activePlannings={activePlannings}
    />
  )
}
