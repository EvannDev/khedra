import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

export type SignInInput = z.infer<typeof signInSchema>
