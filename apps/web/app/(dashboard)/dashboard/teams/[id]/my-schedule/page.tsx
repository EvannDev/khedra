import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RiCalendarLine, RiTimeLine, RiFlowChart, RiStackLine } from "@remixicon/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

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

  const totalShifts = assignments.length
  const totalHours = assignments.reduce(
    (sum, a) => sum + shiftDurationHours(a.shiftType.startTime, a.shiftType.endTime),
    0
  )
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextAssignment = assignments.find((a) => new Date(a.date) >= today) ?? null
  const activePlannings = new Set(assignments.map((a) => a.solution.planningId)).size

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full bg-border" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">My Schedule</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing shifts for <span className="font-medium text-foreground">{employee.name}</span>.
      </p>

      {totalShifts > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <RiStackLine className="size-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total shifts</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{totalShifts}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <RiTimeLine className="size-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total hours</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">h</span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <RiCalendarLine className="size-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Next shift</p>
            </div>
            {nextAssignment ? (
              <p className="text-sm font-medium leading-snug">
                {formatDate(nextAssignment.date)}
                <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                  {nextAssignment.shiftType.name}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">None upcoming</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <RiFlowChart className="size-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Plannings</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{activePlannings}</p>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <RiCalendarLine className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No shifts scheduled yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your schedule will appear here once a planning is solved.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Planning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{formatDate(a.date)}</TableCell>
                  <TableCell>
                    <div
                      className="inline-flex rounded text-[10px] font-semibold leading-none py-[3px] px-1.5 border-l-2"
                      style={{
                        backgroundColor: a.shiftType.color + "18",
                        color: a.shiftType.color,
                        borderLeftColor: a.shiftType.color,
                      }}
                    >
                      {a.shiftType.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.shiftType.startTime} – {a.shiftType.endTime}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.solution.planning.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
