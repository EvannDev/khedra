import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireTeamMember } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { MemberList } from "@/components/teams/member-list"

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const [currentMember, team, employees] = await Promise.all([
    requireTeamMember(id, session!.user!.id),
    prisma.team.findUnique({
      where: { id },
      select: {
        inviteToken: true,
        members: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.employee.findMany({
      where: { teamId: id },
      orderBy: { name: "asc" },
    }),
  ])

  if (!currentMember || !team) notFound()
  if (currentMember.role === "viewer") notFound()

  return (
    <MemberList
      teamId={id}
      members={team.members}
      employees={employees}
      inviteToken={team.inviteToken}
      currentUserRole={currentMember.role}
    />
  )
}
