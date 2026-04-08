"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useController, type Control } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import {
  maxHoursParamsSchema,
  unavailabilityParamsSchema,
  minRestParamsSchema,
  maxConsecutiveParamsSchema,
  requiredSkillParamsSchema,
  weekendFairnessParamsSchema,
  shiftPreferenceParamsSchema,
  minEmployeesParamsSchema,
  holidayParamsSchema,
} from "@/lib/schemas/constraint"
import { Calendar } from "@/components/ui/calendar"
import { RiCloseLine } from "@remixicon/react"
import { CONSTRAINT_TYPE_LABELS } from "@/lib/constraint-utils"
import { createConstraint } from "@/app/actions/constraints"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ConstraintType } from "@/lib/generated/prisma/enums"

const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const

type Day = (typeof DAYS)[number]["value"]

const paramsSchemaMap: Record<ConstraintType, any> = {
  max_hours_per_week: maxHoursParamsSchema,
  unavailability: unavailabilityParamsSchema,
  min_rest_between_shifts: minRestParamsSchema,
  max_consecutive_days: maxConsecutiveParamsSchema,
  required_skill: requiredSkillParamsSchema,
  weekend_fairness: weekendFairnessParamsSchema,
  shift_preference: shiftPreferenceParamsSchema,
  min_employees_per_shift: minEmployeesParamsSchema,
  holiday: holidayParamsSchema,
}

const defaultValuesMap: Record<ConstraintType, Record<string, unknown>> = {
  max_hours_per_week: { max: 35 },
  unavailability: { employee_id: "", days: [] },
  min_rest_between_shifts: { hours: 11 },
  max_consecutive_days: { max: 5 },
  required_skill: { shift_type_id: "", skill: "" },
  weekend_fairness: { max_weekends_per_month: 2 },
  shift_preference: { employee_id: "", shift_type_id: "", weight: "preferred" },
  min_employees_per_shift: { shift_type_id: "", min: 2 },
  holiday: { dates: [], name: "", employee_id: "" },
}

interface ConstraintFormProps {
  teamId: string
  planningId: string
  employees: { id: string; name: string }[]
  shiftTypes: { id: string; name: string }[]
  onSuccess: () => void
}

interface ParamsStepProps {
  type: ConstraintType
  teamId: string
  planningId: string
  employees: { id: string; name: string }[]
  shiftTypes: { id: string; name: string }[]
  onSuccess: () => void
  onBack: () => void
}

function ConstraintParamsStep({
  type,
  teamId,
  planningId,
  employees,
  shiftTypes,
  onSuccess,
  onBack,
}: ParamsStepProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState("")
  const [holidayScope, setHolidayScope] = useState<"all" | "employee">("all")

  const form = useForm<any>({
    resolver: standardSchemaResolver(paramsSchemaMap[type]),
    defaultValues: defaultValuesMap[type],
  })

  async function onSubmit(params: any) {
    setServerError("")
    // Strip empty employee_id before saving
    const cleanParams = { ...params }
    if (type === "holiday" && !cleanParams.employee_id) delete cleanParams.employee_id
    if (type === "holiday" && !cleanParams.name) delete cleanParams.name
    const scope = type === "holiday" ? holidayScope : "all"
    const result = await createConstraint(teamId, planningId, { type, params: cleanParams }, scope)
    if ("error" in result) {
      setServerError(result.error ?? "An error occurred")
      return
    }
    router.refresh()
    onSuccess()
  }

  const control: Control<any> = form.control

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3">
            <div className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
            <p className="text-sm text-destructive leading-snug">{serverError}</p>
          </div>
        )}

        {/* max_hours_per_week */}
        {type === "max_hours_per_week" && (
          <FormField
            control={control}
            name="max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max hours per week</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g. 35" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* min_rest_between_shifts */}
        {type === "min_rest_between_shifts" && (
          <FormField
            control={control}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum rest (hours)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g. 11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* max_consecutive_days */}
        {type === "max_consecutive_days" && (
          <FormField
            control={control}
            name="max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max consecutive days</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g. 5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* weekend_fairness */}
        {type === "weekend_fairness" && (
          <FormField
            control={control}
            name="max_weekends_per_month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max weekends per month</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="e.g. 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* unavailability */}
        {type === "unavailability" && (
          <>
            <FormField
              control={control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DaysField control={control} />
          </>
        )}

        {/* required_skill */}
        {type === "required_skill" && (
          <>
            <FormField
              control={control}
              name="shift_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shiftTypes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="skill"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required skill</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* shift_preference */}
        {type === "shift_preference" && (
          <>
            <FormField
              control={control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="shift_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shiftTypes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preference</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="avoid">Avoid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* min_employees_per_shift */}
        {type === "min_employees_per_shift" && (
          <>
            <FormField
              control={control}
              name="shift_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shiftTypes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum employees</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="e.g. 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* holiday */}
        {type === "holiday" && (
          <>
            {/* Scope toggle */}
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">Type</p>
              <div className="flex rounded-md border border-input overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHolidayScope("all")}
                  className={`flex-1 px-3 py-2 text-sm transition-colors ${
                    holidayScope === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Public holiday
                </button>
                <button
                  type="button"
                  onClick={() => setHolidayScope("employee")}
                  className={`flex-1 px-3 py-2 text-sm border-l border-input transition-colors ${
                    holidayScope === "employee"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Personal time-off
                </button>
              </div>
            </div>

            {/* Employee select — only for personal time-off */}
            {holidayScope === "employee" && (
              <FormField
                control={control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date picker */}
            <HolidayDatesField control={control} />

            {/* Optional name */}
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Christmas, Annual leave…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Adding…
              </>
            ) : (
              "Add constraint"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function HolidayDatesField({ control }: { control: Control<any> }) {
  const { field, fieldState } = useController({
    control,
    name: "dates",
    defaultValue: [],
  })

  const dates = (field.value as string[]) ?? []
  const selectedDays = dates.map((d) => new Date(d + "T12:00:00"))

  function handleSelect(days: Date[] | undefined) {
    field.onChange(
      (days ?? []).map((d) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${y}-${m}-${day}`
      })
    )
  }

  function removeDate(iso: string) {
    field.onChange(dates.filter((d) => d !== iso))
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">Dates</p>
      <div className="rounded-md border border-input overflow-hidden">
        <Calendar
          mode="multiple"
          selected={selectedDays}
          onSelect={handleSelect}
          captionLayout="dropdown"
          className="w-full"
        />
      </div>
      {dates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dates.map((iso) => (
            <span
              key={iso}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {iso}
              <button
                type="button"
                onClick={() => removeDate(iso)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <RiCloseLine className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {fieldState.error && (
        <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  )
}

function DaysField({ control }: { control: Control<any> }) {
  const { field, fieldState } = useController({
    control,
    name: "days",
    defaultValue: [],
  })

  const days = (field.value as Day[]) ?? []

  function toggleDay(day: Day) {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    field.onChange(next)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">Unavailable days</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {DAYS.map(({ value, label }) => (
          <label
            key={value}
            className="flex items-center gap-2 text-sm cursor-pointer select-none"
          >
            <Checkbox
              checked={days.includes(value)}
              onCheckedChange={() => toggleDay(value)}
            />
            {label}
          </label>
        ))}
      </div>
      {fieldState.error && (
        <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  )
}

export function ConstraintForm({
  teamId,
  planningId,
  employees,
  shiftTypes,
  onSuccess,
}: ConstraintFormProps) {
  const [step, setStep] = useState<"type" | "params">("type")
  const [selectedType, setSelectedType] = useState<ConstraintType | "">("")

  const CONSTRAINT_TYPES = Object.keys(CONSTRAINT_TYPE_LABELS) as ConstraintType[]

  if (step === "params" && selectedType) {
    return (
      <ConstraintParamsStep
        key={selectedType}
        type={selectedType}
        teamId={teamId}
        planningId={planningId}
        employees={employees}
        shiftTypes={shiftTypes}
        onSuccess={onSuccess}
        onBack={() => setStep("type")}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Constraint type</label>
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as ConstraintType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a constraint type" />
          </SelectTrigger>
          <SelectContent>
            {CONSTRAINT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {CONSTRAINT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={() => setStep("params")} disabled={!selectedType}>
          Next
        </Button>
      </div>
    </div>
  )
}
