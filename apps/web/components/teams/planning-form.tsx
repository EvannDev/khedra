"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { z } from "zod"
import { format } from "date-fns"
import { createPlanning } from "@/app/actions/plannings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RiCalendarLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

type FormValues = z.infer<typeof formSchema>

export function PlanningForm({ teamId }: { teamId: string }) {
  const [serverError, setServerError] = useState("")

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: { name: "" },
  })

  async function onSubmit(values: FormValues) {
    setServerError("")
    const result = await createPlanning(teamId, {
      name: values.name,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    })
    if (result && "error" in result) {
      setServerError(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                <Input placeholder="e.g. June 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <RiCalendarLine className="size-4 shrink-0" />
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <RiCalendarLine className="size-4 shrink-0" />
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        form.getValues("startDate")
                          ? date <= form.getValues("startDate")
                          : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Creating…
            </>
          ) : (
            "Create planning"
          )}
        </Button>
      </form>
    </Form>
  )
}
