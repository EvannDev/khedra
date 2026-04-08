import { z } from "zod"

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const shiftTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  startTime: z.string().regex(timeRegex, "Must be HH:MM"),
  endTime: z.string().regex(timeRegex, "Must be HH:MM"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color (#rrggbb)"),
})

export type ShiftTypeInput = z.infer<typeof shiftTypeSchema>
