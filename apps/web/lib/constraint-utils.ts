import type { ConstraintType } from "@/lib/generated/prisma/enums"

export const CONSTRAINT_TYPE_LABELS: Record<ConstraintType, string> = {
  max_hours_per_week: "Max hours / week",
  unavailability: "Unavailability",
  min_rest_between_shifts: "Min rest between shifts",
  max_consecutive_days: "Max consecutive days",
  required_skill: "Required skill",
  weekend_fairness: "Weekend fairness",
  shift_preference: "Shift preference",
  min_employees_per_shift: "Min employees / shift",
  holiday: "Holiday / Time-off",
}

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
    case "unavailability":
      return `${emp(params.employee_id as string)} — ${(params.days as string[]).join(", ")}`
    case "min_rest_between_shifts":
      return `${params.hours}h rest minimum`
    case "max_consecutive_days":
      return `Max ${params.max} consecutive days`
    case "required_skill":
      return `${st(params.shift_type_id as string)} requires "${params.skill}"`
    case "weekend_fairness":
      return `Max ${params.max_weekends_per_month} weekends/month`
    case "shift_preference":
      return `${emp(params.employee_id as string)} ${params.weight}s ${st(params.shift_type_id as string)}`
    case "min_employees_per_shift":
      return `${st(params.shift_type_id as string)} needs ≥ ${params.min} employees`
    case "holiday": {
      const dateStr = (params.dates as string[]).join(", ")
      const label = params.name ? `${params.name} — ` : ""
      return params.employee_id
        ? `${label}${emp(params.employee_id as string)}: ${dateStr}`
        : `${label}${dateStr}`
    }
  }
}
