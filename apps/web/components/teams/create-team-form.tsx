"use client"

import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { teamSchema, type TeamInput } from "@/lib/schemas/team"
import { createTeam } from "@/app/actions/teams"
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
import { useState } from "react"

export function CreateTeamForm() {
  const [serverError, setServerError] = useState("")

  const form = useForm<TeamInput>({
    resolver: standardSchemaResolver(teamSchema),
    defaultValues: { name: "" },
  })

  async function onSubmit(values: TeamInput) {
    setServerError("")
    const result = await createTeam(values)
    if (result && "error" in result) {
      setServerError(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3">
            <div className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
            <p className="text-sm text-destructive leading-snug">{serverError}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Night shift team" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Creating…
            </>
          ) : (
            "Create team"
          )}
        </Button>
      </form>
    </Form>
  )
}
