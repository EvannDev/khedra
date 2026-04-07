import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/sign-in" },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Real authorize logic lives in auth.ts — this stub is only used by the middleware bundle
      authorize: () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      if (request.nextUrl.pathname.startsWith("/dashboard")) return isLoggedIn
      return true
    },
  },
} satisfies NextAuthConfig
