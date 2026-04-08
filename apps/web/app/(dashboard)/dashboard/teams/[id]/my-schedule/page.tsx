import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RiCalendarLine } from "@remixicon/react"
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

  const assignments = await prisma.assignment.findMany({
    where: {
      employeeId: employee.id,
      solution: {
        status: "complete",
        planning: { teamId: id },
      },
    },
    include: {
      shiftType: true,
      solution: { include: { planning: true } },
    },
    orderBy: { date: "asc" },
  })

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">My Schedule</h2>
      <p className="text-sm text-muted-foreground">
        Showing shifts for <span className="font-medium text-foreground">{employee.name}</span>.
      </p>

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
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: a.shiftType.color }}
                      />
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
