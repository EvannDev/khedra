"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { shiftTypeSchema, type ShiftTypeInput } from "@/lib/schemas/shift-type"
import { createShiftType, updateShiftType } from "@/app/actions/shift-types"
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
import type { ShiftTypeModel } from "@/lib/generated/prisma/models/ShiftType"

interface ShiftTypeFormProps {
  teamId: string
  shiftType?: ShiftTypeModel
  onSuccess: () => void
}

export function ShiftTypeForm({ teamId, shiftType, onSuccess }: ShiftTypeFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState("")

  const form = useForm<ShiftTypeInput>({
    resolver: standardSchemaResolver(shiftTypeSchema),
    defaultValues: {
      name: shiftType?.name ?? "",
      startTime: shiftType?.startTime ?? "08:00",
      endTime: shiftType?.endTime ?? "16:00",
      color: shiftType?.color ?? "#6366f1",
    },
  })

  async function onSubmit(values: ShiftTypeInput) {
    setServerError("")
    const result = shiftType
      ? await updateShiftType(teamId, shiftType.id, values)
      : await createShiftType(teamId, values)

    if ("error" in result) {
      setServerError(result.error ?? "An error occurred")
      return
    }

    router.refresh()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Morning shift" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent"
                    {...field}
                  />
                  <Input
                    placeholder="#6366f1"
                    value={field.value}
                    onChange={field.onChange}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving…
              </>
            ) : shiftType ? (
              "Save changes"
            ) : (
              "Add shift type"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
