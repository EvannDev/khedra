import { auth } from "@/auth"
import { joinTeamByToken } from "@/app/actions/teams"
import { redirect } from "next/navigation"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/invite/${token}`)
  }

  const result = await joinTeamByToken(token)

  // joinTeamByToken redirects on success; we only reach here on error
  if (result && "error" in result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Invalid invite link</p>
          <p className="text-sm text-muted-foreground">{result.error}</p>
          <a href="/dashboard" className="text-sm underline text-muted-foreground">
            Go to dashboard
          </a>
        </div>
      </div>
    )
  }

  return null
}
