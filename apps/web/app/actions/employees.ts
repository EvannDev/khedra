"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { employeeSchema } from "@/lib/schemas/employee"
import { requireTeamMember } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export async function createEmployee(teamId: string, data: unknown) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const parsed = employeeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const employee = await prisma.employee.create({
      data: { ...parsed.data, teamId },
    })
    return { success: true as const, employee }
  } catch {
    return { error: "Failed to create employee." }
  }
}

export async function updateEmployee(
  teamId: string,
  employeeId: string,
  data: unknown
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  const parsed = employeeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    const employee = await prisma.employee.update({
      where: { id: employeeId, teamId },
      data: parsed.data,
    })
    return { success: true as const, employee }
  } catch {
    return { error: "Failed to update employee." }
  }
}

export async function deleteEmployee(teamId: string, employeeId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(teamId, session.user.id)
  if (!member || member.role === "viewer") return { error: "Forbidden" }

  try {
    await prisma.employee.delete({ where: { id: employeeId, teamId } })
    return { success: true as const }
  } catch {
    return { error: "Failed to delete employee." }
  }
}
