"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format, eachDayOfInterval } from "date-fns"
import { solvePlanning } from "@/app/actions/solutions"
import { analyzeFailure } from "@/app/actions/llm"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RiFlowChart } from "@remixicon/react"
import { cn, computeShiftDurationHours, toLocalDateString } from "@/lib/utils"
import type { PlanningStatus, SolutionStatus } from "@/lib/generated/prisma/enums"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ShiftType {
  id: string
  name: string
  color: string
  startTime: string
  endTime: string
}

interface Assignment {
  id: string
  date: Date
  employeeId: string
  shiftTypeId: string
}

interface Solution {
  id: string
  status: SolutionStatus
  score: number | null
  createdAt: Date
  assignments: Assignment[]
}

interface Constraint {
  type: string
  params: unknown
  enabled: boolean
}

interface SolutionViewProps {
  teamId: string
  planningId: string
  planning: {
    id: string
    status: PlanningStatus
    startDate: Date
    endDate: Date
    _count: { solutions: number }
  }
  employees: { id: string; name: string }[]
  shiftTypes: ShiftType[]
  latestSolution: Solution | null
  constraints: Constraint[]
}

const solutionStatusVariant: Record<SolutionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  complete: "default",
  failed: "destructive",
}

const DAY_ABBR = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

export function SolutionView({
  teamId,
  planningId,
  planning,
  employees,
  shiftTypes,
  latestSolution,
  constraints = [],
}: SolutionViewProps) {
  type AnalysisState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; data: { summary: string; suggestions: Array<{ title: string; description: string }> } }
    | { status: "error"; message: string }

  const router = useRouter()
  const [solving, setSolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" })

  const canSolve = employees.length > 0 && shiftTypes.length > 0

  async function handleSolve() {
    setSolving(true)
    setError(null)
    const result = await solvePlanning(teamId, planningId)
    setSolving(false)
    if ("error" in result) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleAnalyze() {
    setAnalysis({ status: "loading" })
    const result = await analyzeFailure(teamId, planningId, {
      constraints: constraints.map((c) => ({
        type: c.type,
        params: c.params as Record<string, unknown>,
        enabled: c.enabled,
      })),
      employees,
      shiftTypes: shiftTypes.map((s) => ({
        id: s.id,
        name: s.name,
        startTime: new Date(`1970-01-01T${s.startTime}`),
        endTime: new Date(`1970-01-01T${s.endTime}`),
      })),
      startDate: planning.startDate,
      endDate: planning.endDate,
    })
    if ("error" in result) {
      setAnalysis({ status: "error", message: result.error })
      return
    }
    setAnalysis({ status: "done", data: result.analysis })
  }

  // Build shift type lookup
  const shiftTypeMap = useMemo(
    () => new Map(shiftTypes.map((s) => [s.id, s])),
    [shiftTypes]
  )

  const assignmentLookup = useMemo(() => {
    const lookup = new Map<string, Map<string, string[]>>()
    for (const a of latestSolution?.assignments ?? []) {
      const dateStr = toLocalDateString(new Date(a.date))
      if (!lookup.has(a.employeeId)) lookup.set(a.employeeId, new Map())
      const empMap = lookup.get(a.employeeId)!
      if (!empMap.has(dateStr)) empMap.set(dateStr, [])
      empMap.get(dateStr)!.push(a.shiftTypeId)
    }
    return lookup
  }, [latestSolution])

  const { holidayKeys, unavailKeys } = useMemo(() => {
    const holidays = new Set<string>()
    const unavail = new Set<string>()
    for (const c of constraints) {
      if (!c.enabled) continue
      if (c.type === "holiday") {
        const p = c.params as { dates?: string[]; employee_id?: string }
        const empKey = p.employee_id ?? "*"
        for (const d of p.dates ?? []) holidays.add(`${empKey}|${d}`)
      } else if (c.type === "unavailability") {
        const p = c.params as { employee_id?: string; days?: string[] }
        if (!p.employee_id) continue
        for (const day of p.days ?? []) unavail.add(`${p.employee_id}|${day}`)
      }
    }
    return { holidayKeys: holidays, unavailKeys: unavail }
  }, [constraints])

  function getCellState(employeeId: string, date: Date, dateStr: string): "holiday" | "unavailable" | null {
    if (holidayKeys.has(`${employeeId}|${dateStr}`) || holidayKeys.has(`*|${dateStr}`)) return "holiday"
    if (unavailKeys.has(`${employeeId}|${DAY_ABBR[date.getDay()]}`)) return "unavailable"
    return null
  }

  const dates = useMemo(
    () =>
      latestSolution?.status === "complete"
        ? eachDayOfInterval({ start: new Date(planning.startDate), end: new Date(planning.endDate) })
        : [],
    [latestSolution, planning.startDate, planning.endDate]
  )

  const employeeStats = useMemo(() => {
    if (latestSolution?.status !== "complete") return []
    return employees
      .map((emp) => {
        const empAssignments = (latestSolution.assignments ?? []).filter((a) => a.employeeId === emp.id)
        const shiftCount = empAssignments.length
        const totalHours = empAssignments.reduce((sum, a) => {
          const st = shiftTypeMap.get(a.shiftTypeId)
          return st ? sum + computeShiftDurationHours(st.startTime, st.endTime) : sum
        }, 0)
        return { employee: emp, shiftCount, totalHours }
      })
      .sort((a, b) => b.totalHours - a.totalHours)
  }, [latestSolution, employees, shiftTypeMap])

  const empShiftTypeHours = useMemo(() => {
    const result = new Map<string, Map<string, number>>()
    for (const a of latestSolution?.assignments ?? []) {
      const st = shiftTypeMap.get(a.shiftTypeId)
      if (!st) continue
      let empMap = result.get(a.employeeId)
      if (!empMap) { empMap = new Map(); result.set(a.employeeId, empMap) }
      empMap.set(st.id, (empMap.get(st.id) ?? 0) + computeShiftDurationHours(st.startTime, st.endTime))
    }
    return result
  }, [latestSolution, shiftTypeMap])

  const workloadChartData = useMemo(
    () =>
      employeeStats.map(({ employee, shiftCount, totalHours }) => {
        const row: Record<string, unknown> = { name: employee.name, total: totalHours, shifts: shiftCount }
        empShiftTypeHours.get(employee.id)?.forEach((hours, stId) => { row[stId] = hours })
        return row
      }),
    [employeeStats, empShiftTypeHours]
  )

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(shiftTypes.map((st) => [st.id, { label: st.name, color: st.color }])) satisfies ChartConfig,
    [shiftTypes]
  )

  const chartHeight = Math.max(180, employeeStats.length * 44)
  const maxNameLen = employeeStats.reduce((m, e) => Math.max(m, e.employee.name.length), 8)
  const yAxisWidth = Math.min(130, Math.max(80, maxNameLen * 7))

  const totalShifts = employeeStats.reduce((s, e) => s + e.shiftCount, 0)
  const scheduled = employeeStats.filter((e) => e.shiftCount > 0)
  const scheduledCount = scheduled.length
  const avgHours = scheduledCount > 0 ? scheduled.reduce((s, e) => s + e.totalHours, 0) / scheduledCount : 0
  const hoursSpread = employeeStats.length >= 2
    ? employeeStats[0].totalHours - employeeStats[employeeStats.length - 1].totalHours
    : 0

  const dailyCoverageData = useMemo(
    () =>
      dates.map((date) => {
        const dateStr = toLocalDateString(date)
        const count = employees.filter((emp) => (assignmentLookup.get(emp.id)?.get(dateStr)?.length ?? 0) > 0).length
        return {
          date: format(date, "d MMM"),
          day: format(date, "EEE"),
          count,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
        }
      }),
    [dates, employees, assignmentLookup]
  )

  const dailyChartConfig = {
    count: { label: "Employees", color: "hsl(var(--foreground))" },
  } satisfies ChartConfig

  const hasSolution = latestSolution !== null
  const isSolved = latestSolution?.status === "complete"
  const isFailed = latestSolution?.status === "failed"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 rounded-full bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Schedule</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasSolution && isSolved && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSolve}
              disabled={solving || !canSolve}
            >
              {solving ? (
                <>
                  <span className="size-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                  Solving...
                </>
              ) : (
                "Re-solve"
              )}
            </Button>
          )}
          {!isSolved && (
            <Button size="sm" onClick={handleSolve} disabled={solving || !canSolve}>
              {solving ? (
                <>
                  <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Solving...
                </>
              ) : (
                "Solve planning"
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!canSolve && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {employees.length === 0
              ? "Add employees to your team before solving."
              : "Add shift types to your team before solving."}
          </p>
        </div>
      )}

      {canSolve && !hasSolution && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <RiFlowChart className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No schedule yet</p>
              <p className="text-xs text-muted-foreground">
                Run the solver to generate a schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSolution && isFailed && (
        <div className="rounded-xl border border-border bg-muted/20 px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="destructive">Failed</Badge>
            <p className="text-sm text-muted-foreground flex-1">
              The solver could not generate a valid schedule. Check your constraints and try again.
            </p>
            {process.env.NEXT_PUBLIC_LLM_ENABLED === "true" && analysis.status !== "done" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAnalyze}
                disabled={analysis.status === "loading"}
              >
                {analysis.status === "loading" ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin mr-1.5" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze with AI"
                )}
              </Button>
            )}
          </div>

          {analysis.status === "error" && (
            <p className="text-sm text-destructive">{analysis.message}</p>
          )}

          {analysis.status === "done" && (
            <div className="rounded-lg border border-border bg-background px-5 py-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  AI Analysis
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={handleAnalyze}
                >
                  Re-analyze
                </Button>
              </div>
              <p className="text-sm leading-relaxed">{analysis.data.summary}</p>
              {analysis.data.suggestions.length > 0 && (
                <ul className="space-y-2">
                  {analysis.data.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-[3px] size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      <div>
                        <span className="text-sm font-medium">{s.title}: </span>
                        <span className="text-sm text-muted-foreground">{s.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {hasSolution && isSolved && (
        <div className="space-y-4">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Solved {format(new Date(latestSolution!.createdAt), "MMM d, yyyy 'at' HH:mm")}
            </span>
            {latestSolution!.score !== null && (
              <span className="tabular-nums">Score: {latestSolution!.score.toFixed(0)}</span>
            )}
            <span>{planning._count.solutions} iteration{planning._count.solutions !== 1 ? "s" : ""}</span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Total shifts</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{totalShifts}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Employees scheduled</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {scheduledCount}
                <span className="text-sm font-normal text-muted-foreground">/{employees.length}</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Avg hours</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {avgHours % 1 === 0 ? avgHours : avgHours.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground">h</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Hours spread</p>
              <p className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                hoursSpread > avgHours * 0.5 ? "text-amber-600 dark:text-amber-400" : ""
              )}>
                {hoursSpread % 1 === 0 ? hoursSpread : hoursSpread.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground">h</span>
              </p>
            </div>
          </div>

          {/* Schedule grid */}
          <div className="rounded-xl border border-border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-background min-w-[140px] border-r border-border">
                    Employee
                  </TableHead>
                  {dates.map((date) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    return (
                      <TableHead
                        key={date.toISOString()}
                        className={cn(
                          "text-center min-w-[72px] px-1 font-normal text-xs",
                          isWeekend && "bg-muted/50"
                        )}
                      >
                        {format(date, "EEE d")}
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const employeeAssignments = assignmentLookup.get(employee.id)
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="sticky left-0 z-10 bg-background border-r border-border font-medium text-sm py-2">
                        {employee.name}
                      </TableCell>
                      {dates.map((date) => {
                        const dateStr = toLocalDateString(date)
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6
                        const shiftTypeIds = employeeAssignments?.get(dateStr) ?? []
                        const shiftTypesForDay = shiftTypeIds.map((id) => shiftTypeMap.get(id)).filter(Boolean) as ShiftType[]
                        const cellState = shiftTypesForDay.length > 0 ? null : getCellState(employee.id, date, dateStr)
                        return (
                          <TableCell
                            key={dateStr}
                            className={cn(
                              "text-center px-1 py-2",
                              isWeekend && "bg-muted/30",
                              cellState === "holiday" && "bg-amber-50/60 dark:bg-amber-950/20",
                            )}
                            title={
                              shiftTypesForDay.length > 0
                                ? shiftTypesForDay.map((s) => `${s.name} (${s.startTime}–${s.endTime})`).join(", ")
                                : cellState === "holiday"
                                  ? "Holiday / time off"
                                  : cellState === "unavailable"
                                    ? "Unavailable"
                                    : undefined
                            }
                          >
                            {shiftTypesForDay.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {shiftTypesForDay.map((shiftType) => (
                                  <div
                                    key={shiftType.id}
                                    className="mx-1 rounded text-[10px] font-semibold leading-none py-[3px] px-1.5 truncate text-center border-l-2"
                                    style={{
                                      backgroundColor: shiftType.color + "18",
                                      color: shiftType.color,
                                      borderLeftColor: shiftType.color,
                                    }}
                                  >
                                    {shiftType.name.length > 4 ? shiftType.name.slice(0, 4) : shiftType.name}
                                  </div>
                                ))}
                              </div>
                            ) : cellState === "holiday" ? (
                              <div className="mx-1 rounded text-[10px] font-semibold leading-none py-[3px] px-1.5 text-center bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                                off
                              </div>
                            ) : cellState === "unavailable" ? (
                              <div
                                className="mx-1 rounded text-[10px] font-semibold leading-none py-[3px] px-1.5 text-center bg-muted text-muted-foreground/40"
                                style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)" }}
                              >
                                —
                              </div>
                            ) : null}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          {(holidayKeys.size > 0 || unavailKeys.size > 0) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {holidayKeys.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-3.5 rounded bg-amber-100 dark:bg-amber-900/40" />
                  <span>Holiday / time off</span>
                </div>
              )}
              {unavailKeys.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-3.5 rounded bg-muted"
                    style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)" }}
                  />
                  <span>Unavailable</span>
                </div>
              )}
            </div>
          )}

          {/* Daily coverage chart */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 rounded-full bg-border" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Daily coverage</h2>
            </div>
            <div className="rounded-xl border border-border p-4">
              <ChartContainer config={dailyChartConfig} className="h-[160px] aspect-auto">
                <BarChart data={dailyCoverageData} margin={{ left: -8, right: 8, top: 4, bottom: 0 }} maxBarSize={dates.length > 20 ? 10 : 20}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    interval={dates.length > 20 ? 6 : 0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={24}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`${value} employee${value !== 1 ? "s" : ""}`, "Scheduled"]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
                      />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--foreground))"
                    opacity={0.15}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Workload summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 rounded-full bg-border" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workload</h2>
            </div>
            <div className="rounded-xl border border-border p-4">
              <ChartContainer config={chartConfig} className="aspect-auto" style={{ height: chartHeight }}>
                <BarChart
                  layout="vertical"
                  data={workloadChartData}
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                  maxBarSize={22}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={yAxisWidth}
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          const hours = value as number
                          return [
                            `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`,
                            chartConfig[name as string]?.label ?? name,
                          ]
                        }}
                        labelFormatter={(label, payload) => {
                          const total = (payload?.[0]?.payload?.total as number) ?? 0
                          const shifts = (payload?.[0]?.payload?.shifts as number) ?? 0
                          return (
                            <span className="font-semibold">
                              {label} — {total % 1 === 0 ? total : total.toFixed(1)}h · {shifts} shift{shifts !== 1 ? "s" : ""}
                            </span>
                          )
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {shiftTypes.map((st) => (
                    <Bar
                      key={st.id}
                      dataKey={st.id}
                      stackId="stack"
                      fill={st.color}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
