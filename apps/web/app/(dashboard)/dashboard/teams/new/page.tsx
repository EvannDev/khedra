import { CreateTeamForm } from "@/components/teams/create-team-form"

export default function NewTeamPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Create a team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Give your team a name to get started.
        </p>
      </div>
      <CreateTeamForm />
    </div>
  )
}
