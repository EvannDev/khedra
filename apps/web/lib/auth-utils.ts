import { prisma } from "@/lib/prisma"

export async function requireTeamMember(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  })
}
