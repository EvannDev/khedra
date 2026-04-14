import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAvatarUrl } from "@/lib/avatar"
import { ProfileForm } from "./profile-form"
import { DeleteAccountButton } from "@/components/settings/delete-account-button"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const avatarUrl = getAvatarUrl(session.user.email)

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <ProfileForm
          initialName={session.user.name ?? ""}
          email={session.user.email ?? ""}
          avatarUrl={avatarUrl}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight mb-4">Danger zone</h2>
        <DeleteAccountButton />
      </div>
    </div>
  )
}
