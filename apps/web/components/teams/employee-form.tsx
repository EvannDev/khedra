"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { z } from "zod"
import { createEmployee, updateEmployee } from "@/app/actions/employees"
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
import type { EmployeeModel } from "@/lib/generated/prisma/models/Employee"

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  role: z.string().min(1, "Role is required").max(100),
  skillsRaw: z.string(),
})
type FormValues = z.infer<typeof formSchema>

interface EmployeeFormProps {
  teamId: string
  employee?: EmployeeModel
  onSuccess: () => void
}

export function EmployeeForm({ teamId, employee, onSuccess }: EmployeeFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState("")

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      name: employee?.name ?? "",
      role: employee?.role ?? "",
      skillsRaw: employee?.skills.join(", ") ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError("")
    const skills = values.skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const result = employee
      ? await updateEmployee(teamId, employee.id, { name: values.name, role: values.role, skills })
      : await createEmployee(teamId, { name: values.name, role: values.role, skills })

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
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Nurse, Manager" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skillsRaw"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input placeholder="manager, first-aid (comma-separated)" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">Separate multiple skills with commas</p>
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
            ) : employee ? (
              "Save changes"
            ) : (
              "Add employee"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
