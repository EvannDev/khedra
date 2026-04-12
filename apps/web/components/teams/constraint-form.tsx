"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useForm, useController, type Control, type UseFormReturn } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import {
  maxHoursParamsSchema,
  maxHoursPerMonthParamsSchema,
  unavailabilityParamsSchema,
  minRestParamsSchema,
  maxConsecutiveParamsSchema,
  requiredSkillParamsSchema,
  weekendFairnessParamsSchema,
  shiftPreferenceParamsSchema,
  holidayParamsSchema,
  noShiftAlternationParamsSchema,
  minConsecutiveDaysParamsSchema,
  maxDaysPerWeekParamsSchema,
  minDaysBetweenShiftsParamsSchema,
  dayPairingParamsSchema,
  shiftCoverageParamsSchema,
  maxShiftsPerDayParamsSchema,
  noConsecutiveWeekendsParamsSchema,
} from "@/lib/schemas/constraint"
import { Calendar } from "@/components/ui/calendar"
import { RiCloseLine } from "@remixicon/react"
import { CONSTRAINT_TYPE_LABELS, DEPRECATED_CONSTRAINT_TYPES } from "@/lib/constraint-utils"
import { toLocalDateString } from "@/lib/utils"
import { ConstraintCatalog } from "./constraint-catalog"
import { createConstraint, updateConstraint } from "@/app/actions/constraints"
import { translateConstraint } from "@/app/actions/llm"
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
  max_hours_per_month: maxHoursPerMonthParamsSchema,
  unavailability: unavailabilityParamsSchema,
  min_rest_between_shifts: minRestParamsSchema,
  max_consecutive_days: maxConsecutiveParamsSchema,
  required_skill: requiredSkillParamsSchema,
  weekend_fairness: weekendFairnessParamsSchema,
  shift_preference: shiftPreferenceParamsSchema,
  holiday: holidayParamsSchema,
  no_shift_alternation: noShiftAlternationParamsSchema,
  min_consecutive_days: minConsecutiveDaysParamsSchema,
  max_days_per_week: maxDaysPerWeekParamsSchema,
  min_days_between_shifts: minDaysBetweenShiftsParamsSchema,
  day_pairing: dayPairingParamsSchema,
  shift_coverage: shiftCoverageParamsSchema,
  max_shifts_per_day: maxShiftsPerDayParamsSchema,
  no_consecutive_weekends: noConsecutiveWeekendsParamsSchema,
  // Deprecated — kept for type completeness, not shown in form
  min_employees_per_shift: z.object({}),
  max_employees_per_shift: z.object({}),
  preferred_consecutive_days: z.object({}),
}

const defaultValuesMap: Record<ConstraintType, Record<string, unknown>> = {
  max_hours_per_week: { max: 35 },
  max_hours_per_month: { max: 140, employee_id: "" },
  unavailability: { employee_id: "", days: [] },
  min_rest_between_shifts: { hours: 11 },
  max_consecutive_days: { max: 5, mode: "hard" },
  required_skill: { shift_type_id: "", skill: "" },
  weekend_fairness: { max_weekends_per_month: 2 },
  shift_preference: { employee_id: "", shift_type_id: "", weight: "preferred", mode: "soft" },
  holiday: { dates: [], name: "", employee_id: "" },
  no_shift_alternation: { penalty: 3 },
  min_consecutive_days: { min: 2, mode: "soft" },
  max_days_per_week: { max: 5, mode: "hard" },
  min_days_between_shifts: { days: 2, consecutive: 1, mode: "hard" },
  day_pairing: { days: ["sat", "sun"], mode: "hard" },
  shift_coverage: { shift_type_id: "", min: "", max: "", mode: "hard" },
  max_shifts_per_day: { max: 2, employee_id: "" },
  no_consecutive_weekends: { employee_id: "" },
  // Deprecated
  min_employees_per_shift: {},
  max_employees_per_shift: {},
  preferred_consecutive_days: {},
}

interface ConstraintFormProps {
  teamId: string
  planningId: string
  employees: { id: string; name: string; skills: string[] }[]
  shiftTypes: { id: string; name: string }[]
  onSuccess: () => void
}

interface ParamsStepProps {
  type: ConstraintType
  teamId: string
  planningId: string
  employees: { id: string; name: string; skills: string[] }[]
  shiftTypes: { id: string; name: string }[]
  onSuccess: () => void
  onBack: () => void
  /** If provided, the form operates in edit mode and calls updateConstraint. */
  constraintId?: string
  /** Pre-populate form fields when editing an existing constraint. */
  initialParams?: Record<string, unknown>
}

function ModeToggle({ form, softFirst = false }: { form: UseFormReturn<any>; softFirst?: boolean }) {
  const mode = form.watch("mode")
  const btnClass = (val: string) =>
    `flex-1 px-3 py-2 text-sm transition-colors ${mode === val ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
  const hard = (
    <button type="button" onClick={() => form.setValue("mode", "hard")} className={btnClass("hard")}>
      Hard — strictly enforced
    </button>
  )
  const soft = (
    <button type="button" onClick={() => form.setValue("mode", "soft")} className={btnClass("soft")}>
      Soft — preferred
    </button>
  )
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">Mode</p>
      <div className="flex rounded-md border border-input overflow-hidden">
        {softFirst ? <>{soft}{hard}</> : <>{hard}{soft}</>}
      </div>
    </div>
  )
}

export function ConstraintParamsStep({
  type,
  teamId,
  planningId,
  employees,
  shiftTypes,
  onSuccess,
  onBack,
  constraintId,
  initialParams,
}: ParamsStepProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState("")
  const [holidayScope, setHolidayScope] = useState<"all" | "employee">(
    initialParams?.employee_id ? "employee" : "all"
  )

  const allSkills = Array.from(
    new Set(employees.flatMap((e) => e.skills.map((s) => s.toLowerCase())))
  ).sort()

  const form = useForm<any>({
    resolver: standardSchemaResolver(paramsSchemaMap[type]),
    defaultValues: initialParams
      ? { ...defaultValuesMap[type], ...initialParams }
      : defaultValuesMap[type],
  })

  async function onSubmit(params: any) {
    setServerError("")
    const cleanParams = Object.fromEntries(
      Object.entries({ ...params }).filter(([, v]) => v !== "" && v !== undefined && v !== null)
    )

    let result
    if (constraintId) {
      result = await updateConstraint(teamId, planningId, constraintId, { type, params: cleanParams })
    } else {
      const scope = type === "holiday" ? holidayScope : "all"
      result = await createConstraint(teamId, planningId, { type, params: cleanParams }, scope)
    }
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

        {/* max_hours_per_week */}
        {type === "max_hours_per_week" && (
          <FormField
            control={form.control}
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

        {/* max_hours_per_month */}
        {type === "max_hours_per_month" && (
          <>
            <FormField
              control={form.control}
              name="max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max hours per month</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="e.g. 140" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Employee{" "}
                    <span className="text-muted-foreground font-normal">(optional — leave blank to apply to all)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All employees" />
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
          </>
        )}

        {/* min_rest_between_shifts */}
        {type === "min_rest_between_shifts" && (
          <FormField
            control={form.control}
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
          <>
            <ModeToggle form={form} />
            <FormField
              control={form.control}
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
          </>
        )}

        {/* weekend_fairness */}
        {type === "weekend_fairness" && (
          <FormField
            control={form.control}
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
              control={form.control}
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
            <DaysField control={form.control} />
          </>
        )}

        {/* required_skill */}
        {type === "required_skill" && (
          <>
            <FormField
                control={form.control}
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
                control={form.control}
                name="skill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required skill</FormLabel>
                    {allSkills.length > 0 ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select skill" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allSkills.map((skill) => (
                            <SelectItem key={skill} value={skill}>
                              {skill}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input placeholder="e.g. manager" {...field} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
          </>
        )}

        {/* shift_preference */}
        {type === "shift_preference" && (
          <>
            <ModeToggle form={form} softFirst />
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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

        {/* shift_coverage */}
        {type === "shift_coverage" && (
          <>
            <ModeToggle form={form} />
            <FormField
              control={form.control}
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
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Min employees{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="e.g. 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Max employees{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="e.g. 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* max_shifts_per_day */}
        {type === "max_shifts_per_day" && (
          <>
            <FormField
              control={form.control}
              name="max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max shifts per day</FormLabel>
                  <FormControl>
                    <Input type="number" min={2} placeholder="e.g. 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Employee{" "}
                    <span className="text-muted-foreground font-normal">(optional — leave blank to apply to all)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All employees" />
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
          </>
        )}

        {/* no_consecutive_weekends */}
        {type === "no_consecutive_weekends" && (
          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Employee{" "}
                  <span className="text-muted-foreground font-normal">(optional — leave blank to apply to all)</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All employees" />
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

        {/* min_consecutive_days */}
        {type === "min_consecutive_days" && (
          <>
            <ModeToggle form={form} />
            <FormField
              control={form.control}
              name="min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min consecutive days</FormLabel>
                  <FormControl>
                    <Input type="number" min={2} placeholder="e.g. 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* max_days_per_week */}
        {type === "max_days_per_week" && (
          <>
            <ModeToggle form={form} />
            <FormField
              control={form.control}
              name="max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max working days per week</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={7} placeholder="e.g. 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* min_days_between_shifts */}
        {type === "min_days_between_shifts" && (
          <>
            <ModeToggle form={form} />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="consecutive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consecutive shifts</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={14} placeholder="e.g. 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min days off after</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={14} placeholder="e.g. 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              After <strong>{form.watch("consecutive") || 1}</strong> consecutive shift{(form.watch("consecutive") || 1) > 1 ? "s" : ""}, require at least <strong>{form.watch("days") || "?"}</strong> day{(form.watch("days") || 1) > 1 ? "s" : ""} off.
            </p>
          </>
        )}

        {/* day_pairing */}
        {type === "day_pairing" && (
          <>
            <ModeToggle form={form} />
            <DaysField control={form.control} label="Days to pair (all or none)" />
          </>
        )}

        {/* no_shift_alternation */}
        {type === "no_shift_alternation" && (
          <FormField
            control={form.control}
            name="penalty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Penalty per alternation</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={10} placeholder="e.g. 3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                control={form.control}
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
            <HolidayDatesField control={form.control} />

            {/* Optional name */}
            <FormField
              control={form.control}
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
                {constraintId ? "Saving…" : "Adding…"}
              </>
            ) : (
              constraintId ? "Save changes" : "Add constraint"
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
    field.onChange((days ?? []).map((d) => toLocalDateString(d)))
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

function DaysField({ control, label = "Unavailable days" }: { control: Control<any>; label?: string }) {
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
      <p className="text-sm font-medium leading-none">{label}</p>
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

type LlmStatus = "idle" | "loading" | "clarifying" | "error"

export function ConstraintForm({
  teamId,
  planningId,
  employees,
  shiftTypes,
  onSuccess,
}: ConstraintFormProps) {
  const [step, setStep] = useState<"type" | "params">("type")
  const [selectedType, setSelectedType] = useState<ConstraintType | "">("")
  const [llmInitialParams, setLlmInitialParams] = useState<Record<string, unknown> | undefined>()

  const [llmInput, setLlmInput] = useState("")
  const [llmStatus, setLlmStatus] = useState<LlmStatus>("idle")
  const [llmMessage, setLlmMessage] = useState("")
  async function handleGenerate() {
    const input = llmInput.trim()
    if (!input) return
    setLlmStatus("loading")
    setLlmMessage("")
    const result = await translateConstraint(teamId, input, { employees, shiftTypes })
    if ("constraint" in result) {
      setLlmInitialParams(result.constraint.params)
      setSelectedType(result.constraint.type as ConstraintType)
      setStep("params")
      setLlmStatus("idle")
    } else if ("clarification" in result) {
      setLlmStatus("clarifying")
      setLlmMessage(result.clarification)
    } else {
      setLlmStatus("error")
      setLlmMessage(result.error)
    }
  }

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
        onBack={() => {
          setStep("type")
          setLlmInitialParams(undefined)
        }}
        initialParams={llmInitialParams}
      />
    )
  }

  const llmEnabled = process.env.NEXT_PUBLIC_LLM_ENABLED === "true"

  return (
    <div className="space-y-4">
      {llmEnabled && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Describe a constraint</p>
            <textarea
              value={llmInput}
              onChange={(e) => setLlmInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
              placeholder="e.g. Alice can't work on Mondays, or max 5 consecutive days for everyone"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={llmStatus === "loading" || !llmInput.trim()}
              size="sm"
              className="w-full"
            >
              {llmStatus === "loading" ? "Generating..." : "Generate with AI"}
            </Button>
            {llmStatus === "clarifying" && (
              <div className="flex items-start gap-2.5 rounded-lg bg-muted border border-border px-4 py-3">
                <p className="text-sm leading-snug">{llmMessage}</p>
              </div>
            )}
            {llmStatus === "error" && (
              <div className="flex items-start gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3">
                <div className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
                <p className="text-sm text-destructive leading-snug">{llmMessage}</p>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or pick from catalog</span>
            </div>
          </div>
        </>
      )}
      <ConstraintCatalog
        onSelect={(type) => {
          setSelectedType(type)
          setLlmInitialParams(undefined)
          setStep("params")
        }}
      />
    </div>
  )
}
