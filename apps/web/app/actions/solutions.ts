"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireTeamMember } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import type { ConstraintType } from "@/lib/generated/prisma/enums"
import { computeShiftDurationHours, toDbDateString } from "@/lib/utils"

const SOLVER_UNSUPPORTED_TYPES: ConstraintType[] = []

export async function solvePlanning(teamId: string, planningId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const planning = await prisma.planning.findUnique({
    where: { id: planningId, teamId },
  })
  if (!planning) return { error: "Not found" }

  // Prevent concurrent solves (guard for 90 seconds)
  if (planning.status === "solving") {
    const ninetySecondsAgo = new Date(Date.now() - 90_000)
    if (planning.updatedAt > ninetySecondsAgo) {
      return { error: "Solve already in progress." }
    }
  }

  // Mark as solving
  await prisma.planning.update({
    where: { id: planningId },
    data: { status: "solving" },
  })

  let solutionId: string | null = null

  try {
    const [employees, shiftTypes, constraints] = await Promise.all([
      prisma.employee.findMany({
        where: { teamId },
        select: { id: true, name: true, skills: true },
        orderBy: { name: "asc" },
      }),
      prisma.shiftType.findMany({
        where: { teamId },
        select: { id: true, name: true, startTime: true, endTime: true },
        orderBy: { name: "asc" },
      }),
      prisma.constraint.findMany({
        where: { planningId, enabled: true },
        select: { type: true, params: true, scope: true },
      }),
    ])

    if (employees.length === 0) {
      await prisma.planning.update({ where: { id: planningId }, data: { status: "draft" } })
      return { error: "No employees found for this team." }
    }
    if (shiftTypes.length === 0) {
      await prisma.planning.update({ where: { id: planningId }, data: { status: "draft" } })
      return { error: "No shift types found for this team." }
    }

    const solution = await prisma.solution.create({
      data: { planningId, status: "pending" },
    })
    solutionId = solution.id

    const solverPayload = {
      start_date: toDbDateString(planning.startDate),
      end_date: toDbDateString(planning.endDate),
      employees: employees.map((e) => ({ id: e.id, name: e.name, skills: e.skills })),
      shift_types: shiftTypes.map((s) => ({
        id: s.id,
        name: s.name,
        start_time: s.startTime,
        end_time: s.endTime,
        duration_hours: computeShiftDurationHours(s.startTime, s.endTime),
      })),
      constraints: constraints
        .filter((c) => !SOLVER_UNSUPPORTED_TYPES.includes(c.type as ConstraintType))
        .map((c) => ({ type: c.type, params: c.params, scope: c.scope, enabled: true })),
    }

    const solverUrl = process.env.SOLVER_API_URL
    const internalSecret = process.env.INTERNAL_API_SECRET
    if (!solverUrl || !internalSecret) {
      throw new Error("Solver not configured")
    }

    const res = await fetch(`${solverUrl}/solve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": internalSecret,
      },
      body: JSON.stringify(solverPayload),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      await prisma.solution.update({ where: { id: solutionId }, data: { status: "failed" } })
      await prisma.planning.update({ where: { id: planningId }, data: { status: "failed" } })
      return { error: `Solver returned an error (${res.status}).` }
    }

    const data = await res.json()

    if (data.status !== "solved") {
      await prisma.solution.update({ where: { id: solutionId }, data: { status: "failed" } })
      await prisma.planning.update({ where: { id: planningId }, data: { status: "failed" } })
      return { error: data.message ?? "Solver could not find a valid schedule." }
    }

    await prisma.assignment.createMany({
      data: data.assignments.map((a: { employee_id: string; date: string; shift_type_id: string }) => ({
        employeeId: a.employee_id,
        date: new Date(a.date + "T00:00:00.000Z"),
        shiftTypeId: a.shift_type_id,
        solutionId: solutionId!,
      })),
      skipDuplicates: true,
    })

    await prisma.solution.update({
      where: { id: solutionId },
      data: { status: "complete", score: data.score ?? null },
    })
    await prisma.planning.update({
      where: { id: planningId },
      data: { status: "solved" },
    })

    return { success: true as const, solutionId }
  } catch (err) {
    if (solutionId) {
      await prisma.solution.update({ where: { id: solutionId }, data: { status: "failed" } }).catch(() => {})
    }
    await prisma.planning.update({ where: { id: planningId }, data: { status: "failed" } }).catch(() => {})
    const message = err instanceof Error ? err.message : "Unexpected error"
    return { error: message }
  }
}
