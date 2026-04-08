import { prisma } from "@/lib/prisma"
import { ShiftTypeList } from "@/components/teams/shift-type-list"

export default async function ShiftsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const shiftTypes = await prisma.shiftType.findMany({
    where: { teamId: id },
    orderBy: { createdAt: "asc" },
  })

  return <ShiftTypeList teamId={id} shiftTypes={shiftTypes} />
}
