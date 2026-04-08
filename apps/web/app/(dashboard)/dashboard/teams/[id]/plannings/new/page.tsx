import { PlanningForm } from "@/components/teams/planning-form"

export default async function NewPlanningPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New planning</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a date range for this planning period.
        </p>
      </div>
      <PlanningForm teamId={id} />
    </div>
  )
}
