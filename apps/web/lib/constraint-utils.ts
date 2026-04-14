import type { ConstraintType } from "@/lib/generated/prisma/enums"

export const CONSTRAINT_TYPE_COLORS: Record<ConstraintType, string> = {
  max_hours_per_week: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  max_hours_per_month: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-900",
  unavailability: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  min_rest_between_shifts: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-900",
  max_consecutive_days: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
  required_skill: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
  weekend_fairness: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-900",
  shift_preference: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-900",
  holiday: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  no_shift_alternation: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-400 dark:border-fuchsia-900",
  min_consecutive_days: "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-950 dark:text-lime-400 dark:border-lime-900",
  max_days_per_week: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-900",
  min_days_between_shifts: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900",
  day_pairing: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
  shift_coverage: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  max_shifts_per_day: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900",
  no_consecutive_weekends: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900",
  // Deprecated — kept for display of existing constraints
  min_employees_per_shift: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-900",
  max_employees_per_shift: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900",
  preferred_consecutive_days: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900",
}

export const CONSTRAINT_TYPE_LABELS: Record<ConstraintType, string> = {
  max_hours_per_week: "Max hours / week",
  max_hours_per_month: "Max hours / month",
  unavailability: "Unavailability",
  min_rest_between_shifts: "Min rest between shifts",
  max_consecutive_days: "Max consecutive days",
  required_skill: "Required skill",
  weekend_fairness: "Weekend fairness",
  shift_preference: "Shift preference",
  holiday: "Holiday / Time-off",
  no_shift_alternation: "No shift alternation",
  min_consecutive_days: "Min consecutive days",
  max_days_per_week: "Max days / week",
  min_days_between_shifts: "Min days between shifts",
  day_pairing: "Day pairing",
  shift_coverage: "Shift coverage",
  max_shifts_per_day: "Max shifts / day",
  no_consecutive_weekends: "No consecutive weekends",
  // Deprecated
  min_employees_per_shift: "Min employees / shift",
  max_employees_per_shift: "Max employees / shift",
  preferred_consecutive_days: "Preferred consecutive days",
}

export const CONSTRAINT_TYPE_BORDER: Record<ConstraintType, string> = {
  max_hours_per_week: "border-l-blue-400 dark:border-l-blue-500",
  max_hours_per_month: "border-l-cyan-400 dark:border-l-cyan-500",
  unavailability: "border-l-red-400 dark:border-l-red-500",
  min_rest_between_shifts: "border-l-violet-400 dark:border-l-violet-500",
  max_consecutive_days: "border-l-orange-400 dark:border-l-orange-500",
  required_skill: "border-l-emerald-400 dark:border-l-emerald-500",
  weekend_fairness: "border-l-teal-400 dark:border-l-teal-500",
  shift_preference: "border-l-pink-400 dark:border-l-pink-500",
  holiday: "border-l-amber-400 dark:border-l-amber-500",
  no_shift_alternation: "border-l-fuchsia-400 dark:border-l-fuchsia-500",
  min_consecutive_days: "border-l-lime-400 dark:border-l-lime-500",
  max_days_per_week: "border-l-sky-400 dark:border-l-sky-500",
  min_days_between_shifts: "border-l-purple-400 dark:border-l-purple-500",
  day_pairing: "border-l-yellow-400 dark:border-l-yellow-500",
  shift_coverage: "border-l-green-400 dark:border-l-green-500",
  max_shifts_per_day: "border-l-rose-400 dark:border-l-rose-500",
  no_consecutive_weekends: "border-l-indigo-400 dark:border-l-indigo-500",
  // Deprecated
  min_employees_per_shift: "border-l-cyan-400 dark:border-l-cyan-500",
  max_employees_per_shift: "border-l-rose-400 dark:border-l-rose-500",
  preferred_consecutive_days: "border-l-indigo-400 dark:border-l-indigo-500",
}

// Types that should not appear in the constraint creation form
export const DEPRECATED_CONSTRAINT_TYPES = new Set<ConstraintType>([
  "min_employees_per_shift",
  "max_employees_per_shift",
  "preferred_consecutive_days",
])

export const CONSTRAINT_CATEGORIES: { id: string; label: string; types: ConstraintType[] }[] = [
  { id: "availability",  label: "Availability",       types: ["unavailability", "holiday"] },
  { id: "hours",         label: "Hours & Days",        types: ["max_hours_per_week", "max_hours_per_month", "max_days_per_week", "min_days_between_shifts", "max_shifts_per_day"] },
  { id: "consecutive",   label: "Consecutive Work",    types: ["max_consecutive_days", "min_consecutive_days"] },
  { id: "assignment",    label: "Shift Assignment",    types: ["shift_coverage", "required_skill", "shift_preference"] },
  { id: "fairness",      label: "Fairness & Pairing",  types: ["weekend_fairness", "no_consecutive_weekends", "day_pairing"] },
  { id: "rest",          label: "Rest & Rhythm",       types: ["min_rest_between_shifts", "no_shift_alternation"] },
]

type SimpleRecord = Record<string, unknown>

export function formatConstraintParams(
  type: ConstraintType,
  params: SimpleRecord,
  employees: { id: string; name: string }[],
  shiftTypes: { id: string; name: string }[]
): string {
  const emp = (id: string) => employees.find((e) => e.id === id)?.name ?? id
  const st = (id: string) => shiftTypes.find((s) => s.id === id)?.name ?? id

  switch (type) {
    case "max_hours_per_week":
      return `Max ${params.max} h/week`
    case "max_hours_per_month":
      return params.employee_id
        ? `Max ${params.max} h/month — ${emp(params.employee_id as string)}`
        : `Max ${params.max} h/month`
    case "unavailability":
      return `${emp(params.employee_id as string)} — ${(params.days as string[]).join(", ")}`
    case "min_rest_between_shifts":
      return `${params.hours}h rest minimum`
    case "max_consecutive_days":
      return `Max ${params.max} consecutive days (${params.mode ?? "hard"})`
    case "required_skill":
      return `${st(params.shift_type_id as string)} requires "${params.skill}"`
    case "weekend_fairness":
      return `Max ${params.max_weekends_per_month} weekends/month`
    case "shift_preference": {
      const mode = params.mode ?? "soft"
      const base = `${emp(params.employee_id as string)} ${params.weight}s ${st(params.shift_type_id as string)}`
      return mode === "hard" ? `${base} (hard)` : base
    }
    case "no_shift_alternation": {
      const mode = (params.mode as string) ?? "soft"
      const scope = (params.scope as string) ?? "consecutive"
      if (mode === "hard") {
        return scope === "period"
          ? "Fixed shift type (whole period)"
          : "No shift alternation (hard)"
      }
      return `Avoid shift alternation (penalty ${params.penalty})`
    }
    case "min_consecutive_days":
      return `Min ${params.min} consecutive days (${params.mode ?? "soft"})`
    case "max_days_per_week":
      return `Max ${params.max} days/week (${params.mode ?? "hard"})`
    case "min_days_between_shifts": {
      const consec = (params.consecutive as number | undefined) ?? 1
      const mode = params.mode ?? "hard"
      if (consec > 1)
        return `After ${consec} consecutive shifts, min ${params.days} days off (${mode})`
      return `Min ${params.days} days between shifts (${mode})`
    }
    case "day_pairing":
      return `${(params.days as string[]).join(" ↔ ")} paired (${params.mode ?? "hard"})`
    case "shift_coverage": {
      const name = st(params.shift_type_id as string)
      const mode = params.mode ?? "hard"
      if (params.min !== undefined && params.max !== undefined)
        return `${name}: ${params.min}–${params.max} employees (${mode})`
      if (params.min !== undefined)
        return `${name}: ≥ ${params.min} employees (${mode})`
      return `${name}: ≤ ${params.max} employees (${mode})`
    }
    // Deprecated — display only
    case "min_employees_per_shift":
      return `${st(params.shift_type_id as string)} needs ≥ ${params.min} employees`
    case "max_employees_per_shift":
      return `${st(params.shift_type_id as string)} ≤ ${params.max} employees (${params.mode})`
    case "preferred_consecutive_days":
      return `Prefer ${params.days} consecutive working days`
    case "max_shifts_per_day":
      return params.employee_id
        ? `${emp(params.employee_id as string)}: max ${params.max} shifts/day`
        : `Max ${params.max} shifts/day`
    case "holiday": {
      const dateStr = (params.dates as string[]).join(", ")
      const label = params.name ? `${params.name} — ` : ""
      return params.employee_id
        ? `${label}${emp(params.employee_id as string)}: ${dateStr}`
        : `${label}${dateStr}`
    }
    case "no_consecutive_weekends":
      return params.employee_id
        ? `No consecutive weekends — ${emp(params.employee_id as string)}`
        : "No consecutive weekends"
  }
}
