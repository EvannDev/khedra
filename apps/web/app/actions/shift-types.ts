"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { shiftTypeSchema } from "@/lib/schemas/shift-type"
import { requireTeamMember } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export async function createShiftType(teamId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const parsed = shiftTypeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const shiftType = await prisma.shiftType.create({
      data: { ...parsed.data, teamId },
    })
    return { success: true as const, shiftType }
  } catch {
    return { error: "Failed to create shift type." }
  }
}

export async function updateShiftType(
  teamId: string,
  shiftTypeId: string,
  data: unknown
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const parsed = shiftTypeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const shiftType = await prisma.shiftType.update({
      where: { id: shiftTypeId, teamId },
      data: parsed.data,
    })
    return { success: true as const, shiftType }
  } catch {
    return { error: "Failed to update shift type." }
  }
}

export async function deleteShiftType(teamId: string, shiftTypeId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  try {
    await prisma.shiftType.delete({ where: { id: shiftTypeId, teamId } })
    return { success: true as const }
  } catch {
    return { error: "Failed to delete shift type." }
  }
}
