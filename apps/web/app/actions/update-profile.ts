"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { profileSchema } from "@/lib/schemas/profile"
import { redirect } from "next/navigation"

export async function updateProfile(data: unknown): Promise<{ success: true; name: string } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { name } = parsed.data

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    })
    return { success: true, name }
  } catch {
    return { error: "Failed to update profile. Please try again." }
  }
}
