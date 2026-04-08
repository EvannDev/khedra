import { z } from "zod"

export const planningSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

export type PlanningInput = z.infer<typeof planningSchema>
