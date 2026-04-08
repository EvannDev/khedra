import { z } from "zod"

// Per-type params schemas (exported individually for dynamic form resolvers)
export const maxHoursParamsSchema = z.object({
  max: z.coerce.number().int().min(1, "Must be at least 1"),
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
})

export const minEmployeesParamsSchema = z.object({
  shift_type_id: z.string().min(1, "Select a shift type"),
  min: z.coerce.number().int().min(1, "Must be at least 1"),
})

export const holidayParamsSchema = z.object({
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"))
    .min(1, "Select at least one date"),
  name: z.string().max(100).optional(),
  employee_id: z.string().optional(),
})

// Top-level discriminated union used by the server action
export const constraintSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("max_hours_per_week"), params: maxHoursParamsSchema }),
  z.object({ type: z.literal("unavailability"), params: unavailabilityParamsSchema }),
  z.object({ type: z.literal("min_rest_between_shifts"), params: minRestParamsSchema }),
  z.object({ type: z.literal("max_consecutive_days"), params: maxConsecutiveParamsSchema }),
  z.object({ type: z.literal("required_skill"), params: requiredSkillParamsSchema }),
  z.object({ type: z.literal("weekend_fairness"), params: weekendFairnessParamsSchema }),
  z.object({ type: z.literal("shift_preference"), params: shiftPreferenceParamsSchema }),
  z.object({ type: z.literal("min_employees_per_shift"), params: minEmployeesParamsSchema }),
  z.object({ type: z.literal("holiday"), params: holidayParamsSchema }),
])

export type ConstraintInput = z.infer<typeof constraintSchema>
