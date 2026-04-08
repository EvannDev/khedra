import { z } from "zod"

export const employeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  role: z.string().min(1, "Role is required").max(100),
  skills: z.array(z.string()).default([]),
})

export type EmployeeInput = z.infer<typeof employeeSchema>
