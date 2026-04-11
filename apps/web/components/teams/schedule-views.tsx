"use client"

import { useState } from "react"
import {
  RiCalendarLine,
  RiTimeLine,
  RiFlowChart,
  RiStackLine,
  RiListUnordered,
  RiCalendarScheduleLine,
  RiLayoutRowLine,
} from "@remixicon/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type AssignmentRow = {
  id: string
  date: string // ISO string
  shiftType: { name: string; startTime: string; endTime: string; color: string }
  planningName: string
}

type View = "list" | "calendar" | "row"

type Props = {
  assignments: AssignmentRow[]
  employeeName: string
  totalHours: number
  nextAssignment: AssignmentRow | null
  activePlannings: number
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const todayStr = new Date().toISOString().slice(0, 10)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function ShiftBadge({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="inline-flex rounded text-[10px] font-semibold leading-none py-[3px] px-1.5 border-l-2 whitespace-nowrap"
      style={{
        backgroundColor: color + "18",
        color,
        borderLeftColor: color,
      }}
    >
      {name}
    </div>
  )
}

function StatCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      {children}
    </div>
  )
}

// List view
function ListView({ assignments }: { assignments: AssignmentRow[] }) {
  return (
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
                <ShiftBadge name={a.shiftType.name} color={a.shiftType.color} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {a.shiftType.startTime} – {a.shiftType.endTime}
              </TableCell>
              <TableCell className="text-muted-foreground">{a.planningName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Calendar view
function CalendarView({ assignments }: { assignments: AssignmentRow[] }) {
  const byDate = new Map<string, AssignmentRow>()
  const months = new Map<string, { year: number; month: number }>()

  for (const a of assignments) {
    byDate.set(a.date.slice(0, 10), a)
    const d = new Date(a.date)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    months.set(key, { year: d.getUTCFullYear(), month: d.getUTCMonth() })
  }

  return (
    <div className="space-y-6">
      {Array.from(months.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, { year, month }]) => {
          const firstDay = new Date(Date.UTC(year, month, 1))
          const lastDay = new Date(Date.UTC(year, month + 1, 0))
          // Monday-based: Monday=0 … Sunday=6
          const startOffset = (firstDay.getUTCDay() + 6) % 7
          const totalCells = startOffset + lastDay.getUTCDate()
          const rows = Math.ceil(totalCells / 7)

          return (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
              </p>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-7 border-b border-border bg-muted/40">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: rows * 7 }).map((_, i) => {
                    const dayNum = i - startOffset + 1
                    const isValid = dayNum >= 1 && dayNum <= lastDay.getUTCDate()
                    const dateStr = isValid
                      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                      : null
                    const assignment = dateStr ? byDate.get(dateStr) : undefined
                    const isToday = dateStr === todayStr
                    const isPast = dateStr ? dateStr < todayStr : false
                    const isLastRow = i >= (rows - 1) * 7
                    const isLastCol = (i % 7) === 6

                    return (
                      <div
                        key={i}
                        className={cn(
                          "min-h-[72px] p-2 flex flex-col gap-1",
                          !isLastRow && "border-b border-border",
                          !isLastCol && "border-r border-border",
                          !isValid && "bg-muted/20",
                          isPast && isValid && "opacity-50",
                        )}
                      >
                        {isValid && (
                          <>
                            <span
                              className={cn(
                                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full self-start",
                                isToday ? "bg-foreground text-background" : "text-foreground",
                              )}
                            >
                              {dayNum}
                            </span>
                            {assignment && (
                              <div className="mt-auto">
                                <ShiftBadge
                                  name={assignment.shiftType.name}
                                  color={assignment.shiftType.color}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

// Row / Timeline view
function RowView({ assignments }: { assignments: AssignmentRow[] }) {
  if (assignments.length === 0) return null

  const byDate = new Map<string, AssignmentRow>()
  for (const a of assignments) {
    byDate.set(a.date.slice(0, 10), a)
  }

  // Build week buckets: Mon–Sun
  const first = new Date(assignments[0].date)
  const last = new Date(assignments[assignments.length - 1].date)

  // Roll back to Monday of the first week
  const startMonday = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate()))
  const dow = (startMonday.getUTCDay() + 6) % 7 // Mon=0
  startMonday.setUTCDate(startMonday.getUTCDate() - dow)

  const weeks: Date[][] = []
  const cursor = new Date(startMonday)
  while (cursor <= last) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(week)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32 whitespace-nowrap">Week</TableHead>
            {DAY_LABELS.map((d) => (
              <TableHead key={d} className="text-center">{d}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {weeks.map((week, wi) => {
            const monday = week[0]
            const label = monday.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })
            return (
              <TableRow key={wi}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                  {label}
                </TableCell>
                {week.map((day, di) => {
                  const dateStr = day.toISOString().slice(0, 10)
                  const assignment = byDate.get(dateStr)
                  const isToday = dateStr === todayStr
                  return (
                    <TableCell
                      key={di}
                      className={cn("text-center py-2", isToday && "bg-muted/50")}
                    >
                      {assignment ? (
                        <ShiftBadge
                          name={assignment.shiftType.name}
                          color={assignment.shiftType.color}
                        />
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// Main export
export function ScheduleViews({ assignments, employeeName, totalHours, nextAssignment, activePlannings }: Props) {
  const [view, setView] = useState<View>("list")
  const totalShifts = assignments.length

  const VIEWS: { id: View; icon: React.ReactNode; label: string }[] = [
    { id: "list", icon: <RiListUnordered className="size-3.5" />, label: "List" },
    { id: "calendar", icon: <RiCalendarScheduleLine className="size-3.5" />, label: "Calendar" },
    { id: "row", icon: <RiLayoutRowLine className="size-3.5" />, label: "Row" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 rounded-full bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">My Schedule</h2>
        </div>

        {totalShifts > 0 && (
          <div className="flex rounded-lg border border-border overflow-hidden">
            {VIEWS.map(({ id, icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                title={label}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
                  id !== "list" && "border-l border-border",
                  view === id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing shifts for <span className="font-medium text-foreground">{employeeName}</span>.
      </p>

      {totalShifts > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard icon={<RiStackLine className="size-3 text-muted-foreground" />} label="Total shifts">
            <p className="text-2xl font-bold tracking-tight">{totalShifts}</p>
          </StatCard>
          <StatCard icon={<RiTimeLine className="size-3 text-muted-foreground" />} label="Total hours">
            <p className="text-2xl font-bold tracking-tight">
              {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">h</span>
            </p>
          </StatCard>
          <StatCard icon={<RiCalendarLine className="size-3 text-muted-foreground" />} label="Next shift">
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
          </StatCard>
          <StatCard icon={<RiFlowChart className="size-3 text-muted-foreground" />} label="Plannings">
            <p className="text-2xl font-bold tracking-tight">{activePlannings}</p>
          </StatCard>
        </div>
      )}

      {totalShifts === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <RiCalendarLine className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No shifts scheduled yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your schedule will appear here once a planning is solved.
          </p>
        </div>
      ) : view === "list" ? (
        <ListView assignments={assignments} />
      ) : view === "calendar" ? (
        <CalendarView assignments={assignments} />
      ) : (
        <RowView assignments={assignments} />
      )}
    </div>
  )
}
