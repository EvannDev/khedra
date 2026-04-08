"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { planningSchema } from "@/lib/schemas/planning"
import { requireTeamMember } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export async function createPlanning(teamId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const parsed = planningSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    await prisma.planning.create({
      data: {
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        teamId,
      },
    })
  } catch {
    return { error: "Failed to create planning." }
  }
  redirect(`/dashboard/teams/${teamId}/plannings`)
}

export async function updatePlanning(
  teamId: string,
  planningId: string,
  data: unknown
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const parsed = planningSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const planning = await prisma.planning.update({
      where: { id: planningId, teamId },
      data: {
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
      },
    })
    return { success: true as const, planning }
  } catch {
    return { error: "Failed to update planning." }
  }
}

export async function deletePlanning(teamId: string, planningId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  try {
    await prisma.planning.delete({ where: { id: planningId, teamId } })
    return { success: true as const }
  } catch {
    return { error: "Failed to delete planning." }
  }
}
