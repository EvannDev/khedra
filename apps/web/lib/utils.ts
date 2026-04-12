import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * Parse "HH:MM" shift times and return duration in fractional hours.
 * Handles overnight shifts (end < start) by adding 24h.
 */
export function computeShiftDurationHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  const startMin = sh * 60 + sm
  let endMin = eh * 60 + em
  if (endMin <= startMin) endMin += 24 * 60
  return (endMin - startMin) / 60
}

/**
 * Format a local Date as "YYYY-MM-DD" using local-time components.
 * Use this client-side. For server-side DB dates use toDbDateString instead.
 */
export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Format a DB Date (stored as local midnight) as "YYYY-MM-DD".
 * Adds 12h before slicing to avoid off-by-one in positive-offset timezones.
 */
export function toDbDateString(date: Date): string {
  return new Date(date.getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
