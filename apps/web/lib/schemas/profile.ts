import { z } from "zod"

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
})

export type ProfileInput = z.infer<typeof profileSchema>
