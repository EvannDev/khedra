"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { constraintSchema } from "@/lib/schemas/constraint"
import { requireTeamMember } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

async function verifyPlanningOwnership(planningId: string, teamId: string) {
  return prisma.planning.findUnique({ where: { id: planningId, teamId } })
}

export async function createConstraint(
  teamId: string,
  planningId: string,
  data: unknown,
  scope: "all" | "employee" = "all"
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const planning = await verifyPlanningOwnership(planningId, teamId)
  if (!planning) return { error: "Not found" }

  const parsed = constraintSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const constraint = await prisma.constraint.create({
      data: {
        type: parsed.data.type,
        params: parsed.data.params,
        planningId,
        scope,
        source: "manual",
        enabled: true,
      },
    })
    return { success: true as const, constraint }
  } catch {
    return { error: "Failed to create constraint." }
  }
}

export async function toggleConstraint(
  teamId: string,
  planningId: string,
  constraintId: string,
  enabled: boolean
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const planning = await verifyPlanningOwnership(planningId, teamId)
  if (!planning) return { error: "Not found" }

  try {
    await prisma.constraint.update({
      where: { id: constraintId, planningId },
      data: { enabled },
    })
    return { success: true as const }
  } catch {
    return { error: "Failed to update constraint." }
  }
}

export async function deleteConstraint(
  teamId: string,
  planningId: string,
  constraintId: string
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const planning = await verifyPlanningOwnership(planningId, teamId)
  if (!planning) return { error: "Not found" }

  try {
    await prisma.constraint.delete({ where: { id: constraintId, planningId } })
    return { success: true as const }
  } catch {
    return { error: "Failed to delete constraint." }
  }
}
