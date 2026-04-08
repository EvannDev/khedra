import { prisma } from "@/lib/prisma"
import { PlanningList } from "@/components/teams/planning-list"

export default async function PlanningsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const plannings = await prisma.planning.findMany({
    where: { teamId: id },
    orderBy: { createdAt: "desc" },
  })

  return <PlanningList teamId={id} plannings={plannings} />
}
