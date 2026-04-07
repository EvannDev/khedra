import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/sign-in" },
  providers: [Google],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      if (request.nextUrl.pathname.startsWith("/dashboard")) return isLoggedIn
      return true
    },
  },
} satisfies NextAuthConfig
