"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileSchema, type ProfileInput } from "@/lib/schemas/profile"
import { updateProfile } from "@/app/actions/update-profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RiCheckLine, RiUserLine } from "@remixicon/react"

interface ProfileFormProps {
  initialName: string
  email: string
  avatarUrl: string
}

export function ProfileForm({ initialName, email, avatarUrl }: ProfileFormProps) {
  const router = useRouter()
  const { update } = useSession()
  const [serverError, setServerError] = useState("")
  const [saved, setSaved] = useState(false)

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialName },
  })

  async function onSubmit(values: ProfileInput) {
    setServerError("")
    setSaved(false)

    const result = await updateProfile(values)

    if ("error" in result) {
      setServerError(result.error)
      return
    }

    await update({ name: result.name })
    router.refresh()
    setSaved(true)
  }

  return (
    <div className="space-y-8">
      {/* Avatar + email */}
      <div className="flex items-center gap-5">
        <div className="relative size-20 shrink-0 rounded-full overflow-hidden bg-muted border border-border">
          <img
            src={avatarUrl}
            alt="Your avatar"
            className="size-full object-cover"
          />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{email}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RiUserLine className="size-3" />
            Avatar generated automatically from your account
          </p>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {serverError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3">
              <div className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
              <p className="text-sm text-destructive leading-snug">{serverError}</p>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2.5 rounded-lg bg-primary/8 border border-primary/20 px-4 py-3">
              <RiCheckLine className="size-4 text-primary shrink-0" />
              <p className="text-sm text-primary leading-snug">Profile updated successfully.</p>
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input
              value={email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed — it is managed by your sign-in provider.
            </p>
          </div>

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="gap-2"
          >
            {form.formState.isSubmitting ? (
              <>
                <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
