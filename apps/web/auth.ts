import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { sendMagicLinkEmail } from "@/lib/resend"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) token.id = user.id
      if (trigger === "update" && session?.name) {
        token.name = session.name
      }
      return token
    },
    session({ session, token, trigger, newSession }) {
      if (token.id) session.user.id = token.id as string
      if (trigger === "update" && newSession?.name) {
        session.user.name = newSession.name
      }
      return session
    },
  },
  providers: [
    Google,
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLinkEmail(identifier, url)
      },
    }),
  ],
})
