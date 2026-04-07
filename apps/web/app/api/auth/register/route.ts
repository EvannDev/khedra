import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signUpSchema } from "@/lib/schemas/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signUpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password } = parsed.data
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || null

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        hashedPassword,
      },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error("[register]", err)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
