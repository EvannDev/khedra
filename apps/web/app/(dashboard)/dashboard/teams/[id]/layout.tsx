import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireTeamMember } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { TeamNav } from "@/components/teams/team-nav"
import { DeleteTeamButton } from "@/components/teams/delete-team-button"

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const member = await requireTeamMember(id, session!.user!.id)
  if (!member) notFound()

  const team = await prisma.team.findUnique({ where: { id } })
  if (!team) notFound()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight">{team.name}</h1>
        <DeleteTeamButton teamId={id} />
      </div>
      <TeamNav teamId={id} role={member.role} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
