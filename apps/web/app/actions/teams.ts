"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { teamSchema } from "@/lib/schemas/team"
import { requireTeamMember } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export async function createTeam(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const parsed = teamSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  let teamId: string
  try {
    const team = await prisma.team.create({ data: { name: parsed.data.name } })
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: session.user.id, role: "admin" },
    })
    teamId = team.id
  } catch {
    return { error: "Failed to create team. Please try again." }
  }
  redirect(`/dashboard/teams/${teamId}/employees`)
}

export async function updateTeam(teamId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member) return { error: "Forbidden" }

  const parsed = teamSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: { name: parsed.data.name },
    })
    return { success: true as const, team }
  } catch {
    return { error: "Failed to update team." }
  }
}

export async function deleteTeam(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member) return { error: "Forbidden" }

  try {
    await prisma.team.delete({ where: { id: teamId } })
  } catch {
    return { error: "Failed to delete team." }
  }
  redirect("/dashboard")
}

export async function generateInviteToken(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role !== "admin") return { error: "Only admins can manage invite links." }

  const token = crypto.randomUUID()
  try {
    await prisma.team.update({ where: { id: teamId }, data: { inviteToken: token } })
    return { success: true as const, token }
  } catch {
    return { error: "Failed to generate invite link." }
  }
}

export async function linkMemberToEmployee(
  teamId: string,
  memberUserId: string,
  employeeId: string | null
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role !== "admin") return { error: "Only admins can link members to employees." }

  try {
    if (employeeId) {
      await prisma.employee.update({
        where: { id: employeeId, teamId },
        data: { userId: memberUserId },
      })
    } else {
      await prisma.employee.updateMany({
        where: { teamId, userId: memberUserId },
        data: { userId: null },
      })
    }
    return { success: true as const }
  } catch {
    return { error: "Failed to link employee." }
  }
}

export async function joinTeamByToken(token: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const team = await prisma.team.findUnique({ where: { inviteToken: token } })
  if (!team) return { error: "Invalid or expired invite link." }

  const existing = await requireTeamMember(team.id, session.user.id)
  if (existing) {
    redirect(`/dashboard/teams/${team.id}/employees`)
  }

  try {
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: session.user.id, role: "viewer" },
    })
  } catch {
    return { error: "Failed to join team." }
  }
  redirect(`/dashboard/teams/${team.id}/employees`)
}
