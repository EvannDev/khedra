import { z } from "zod"

// Per-type params schemas (exported individually for dynamic form resolvers)
export const maxHoursParamsSchema = z.object({
  max: z.coerce.number().int().min(1, "Must be at least 1"),
})

export const maxHoursPerMonthParamsSchema = z.object({
  max: z.coerce.number().int().min(1, "Must be at least 1"),
  employee_id: z.string().optional(),
})

export const unavailabilityParamsSchema = z.object({
  employee_id: z.string().min(1, "Select an employee"),
  days: z
    .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
    .min(1, "Select at least one day"),
})

export const minRestParamsSchema = z.object({
  hours: z.coerce.number().int().min(1, "Must be at least 1"),
})

export const maxConsecutiveParamsSchema = z.object({
  max: z.coerce.number().int().min(1, "Must be at least 1"),
  mode: z.enum(["hard", "soft"]).default("hard"),
})

export const requiredSkillParamsSchema = z.object({
  shift_type_id: z.string().min(1, "Select a shift type"),
  skill: z.string().min(1, "Skill is required"),
})

export const weekendFairnessParamsSchema = z.object({
  max_weekends_per_month: z.coerce.number().int().min(0, "Must be 0 or more"),
})

export const shiftPreferenceParamsSchema = z.object({
  employee_id: z.string().min(1, "Select an employee"),
  shift_type_id: z.string().min(1, "Select a shift type"),
  weight: z.enum(["preferred", "avoid"]),
  mode: z.enum(["hard", "soft"]).default("soft"),
})

export const holidayParamsSchema = z.object({
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"))
    .min(1, "Select at least one date"),
  name: z.string().max(100).optional(),
  employee_id: z.string().optional(),
})

export const noShiftAlternationParamsSchema = z.object({
  penalty: z.coerce.number().int().min(1, "Must be at least 1").max(10, "Must be 10 or fewer"),
  mode: z.enum(["hard", "soft"]).default("soft"),
  scope: z.enum(["consecutive", "period"]).default("consecutive"),
})

export const minConsecutiveDaysParamsSchema = z.object({
  min: z.coerce.number().int().min(2, "Must be at least 2"),
  mode: z.enum(["hard", "soft"]).default("soft"),
})

export const maxDaysPerWeekParamsSchema = z.object({
  max: z.coerce.number().int().min(1, "Must be at least 1").max(7, "Must be 7 or fewer"),
  mode: z.enum(["hard", "soft"]).default("hard"),
})

export const minDaysBetweenShiftsParamsSchema = z.object({
  days: z.coerce.number().int().min(1, "Must be at least 1").max(14, "Must be 14 or fewer"),
  consecutive: z.coerce.number().int().min(1, "Must be at least 1").max(14, "Must be 14 or fewer").default(1),
  mode: z.enum(["hard", "soft"]).default("hard"),
})

export const dayPairingParamsSchema = z.object({
  days: z
    .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
    .min(2, "Select at least 2 days")
    .refine((arr) => new Set(arr).size === arr.length, { message: "Days must be unique" }),
  mode: z.enum(["hard", "soft"]).default("hard"),
})

export const maxShiftsPerDayParamsSchema = z.object({
  max: z.coerce.number().int().min(2, "Must be at least 2"),
  employee_id: z.string().optional(),
})

const coerceOptionalInt = (minVal: number) =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(minVal, `Must be at least ${minVal}`).optional()
  )

export const noConsecutiveWeekendsParamsSchema = z.object({
  employee_id: z.string().optional(),
})

export const shiftCoverageParamsSchema = z
  .object({
    shift_type_id: z.string().min(1, "Select a shift type"),
    min: coerceOptionalInt(1),
    max: coerceOptionalInt(1),
    mode: z.enum(["hard", "soft"]).default("hard"),
  })
  .refine((d) => d.min !== undefined || d.max !== undefined, {
    message: "Set at least a minimum or maximum",
    path: ["min"],
  })

// Top-level discriminated union used by the server action
export const constraintSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("max_hours_per_week"), params: maxHoursParamsSchema }),
  z.object({ type: z.literal("max_hours_per_month"), params: maxHoursPerMonthParamsSchema }),
  z.object({ type: z.literal("unavailability"), params: unavailabilityParamsSchema }),
  z.object({ type: z.literal("min_rest_between_shifts"), params: minRestParamsSchema }),
  z.object({ type: z.literal("max_consecutive_days"), params: maxConsecutiveParamsSchema }),
  z.object({ type: z.literal("required_skill"), params: requiredSkillParamsSchema }),
  z.object({ type: z.literal("weekend_fairness"), params: weekendFairnessParamsSchema }),
  z.object({ type: z.literal("shift_preference"), params: shiftPreferenceParamsSchema }),
  z.object({ type: z.literal("holiday"), params: holidayParamsSchema }),
  z.object({ type: z.literal("no_shift_alternation"), params: noShiftAlternationParamsSchema }),
  z.object({ type: z.literal("min_consecutive_days"), params: minConsecutiveDaysParamsSchema }),
  z.object({ type: z.literal("max_days_per_week"), params: maxDaysPerWeekParamsSchema }),
  z.object({ type: z.literal("min_days_between_shifts"), params: minDaysBetweenShiftsParamsSchema }),
  z.object({ type: z.literal("day_pairing"), params: dayPairingParamsSchema }),
  z.object({ type: z.literal("shift_coverage"), params: shiftCoverageParamsSchema }),
  z.object({ type: z.literal("max_shifts_per_day"), params: maxShiftsPerDayParamsSchema }),
  z.object({ type: z.literal("no_consecutive_weekends"), params: noConsecutiveWeekendsParamsSchema }),
])

export type ConstraintInput = z.infer<typeof constraintSchema>
