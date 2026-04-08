import { prisma } from "@/lib/prisma"
import { EmployeeList } from "@/components/teams/employee-list"

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const employees = await prisma.employee.findMany({
    where: { teamId: id },
    orderBy: { createdAt: "asc" },
  })

  return <EmployeeList teamId={id} employees={employees} />
}
