import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireTeamMember } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { ConstraintList } from "@/components/teams/constraint-list"

export default async function TeamConstraintsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await requireTeamMember(id, session.user.id)
  if (!member) redirect("/dashboard")

  const [constraints, employees, shiftTypes] = await Promise.all([
    prisma.constraint.findMany({
      where: { teamId: id, planningId: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.employee.findMany({
      where: { teamId: id },
      select: { id: true, name: true, skills: true },
      orderBy: { name: "asc" },
    }),
    prisma.shiftType.findMany({
      where: { teamId: id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <ConstraintList
      teamId={id}
      planningId={null}
      constraints={constraints}
      employees={employees}
      shiftTypes={shiftTypes}
    />
  )
}
