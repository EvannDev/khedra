import { z } from "zod"

export const teamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Name is too long"),
})

export type TeamInput = z.infer<typeof teamSchema>
