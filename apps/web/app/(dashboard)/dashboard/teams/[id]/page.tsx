import { redirect } from "next/navigation"

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/teams/${id}/employees`)
}
