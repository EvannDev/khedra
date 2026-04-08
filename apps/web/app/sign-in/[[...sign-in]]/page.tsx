"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { signInSchema, type SignInInput } from "@/lib/schemas/auth"
import {
  RiMailLine,
  RiArrowRightLine,
  RiGoogleFill,
  RiCalendarScheduleLine,
  RiMailSendLine,
} from "@remixicon/react"

const SHIFT_DAYS = [
  { label: "M", shifts: [true, true] },
  { label: "T", shifts: [true, false] },
  { label: "W", shifts: [true, true] },
  { label: "T", shifts: [true, false] },
  { label: "F", shifts: [true, true] },
  { label: "S", shifts: [false, false] },
  { label: "S", shifts: [false, false] },
]

export default function SignInPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const [serverError, setServerError] = useState("")

  const form = useForm<SignInInput>({
    resolver: standardSchemaResolver(signInSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: SignInInput) {
    setServerError("")
    try {
      await signIn("resend", {
        email: values.email,
        redirect: false,
        callbackUrl: "/dashboard",
      })
      setSentEmail(values.email)
      setSent(true)
    } catch {
      setServerError("Failed to send the magic link. Please try again.")
    }
  }

  function handleGoogleSignIn() {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div className="flex min-h-screen w-full">

      {/* ── Left panel: branding ── */}
      <div className="relative hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-12 overflow-hidden select-none">

        <svg className="absolute inset-0 w-full h-full text-primary-foreground/10" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <defs>
            <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-28 -left-28 w-[420px] h-[420px] rounded-full bg-primary-foreground/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/20">
            <RiCalendarScheduleLine className="size-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-primary-foreground">khedra</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="bg-primary-foreground/12 backdrop-blur-sm rounded-2xl p-5 border border-primary-foreground/15">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-primary-foreground/50">Week overview</span>
              <span className="text-[11px] text-primary-foreground/40">Apr 7–13</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {SHIFT_DAYS.map(({ label, shifts }, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-medium text-primary-foreground/40">{label}</span>
                  <div className="w-full flex flex-col gap-1">
                    {shifts.map((active, j) => (
                      <div key={j} className={`h-7 rounded-md transition-colors ${active ? "bg-primary-foreground/30 border border-primary-foreground/20" : "bg-primary-foreground/8 border border-primary-foreground/10"}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-primary-foreground/15 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/60" />
                <span className="text-[11px] text-primary-foreground/50">12 shifts assigned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/20" />
                <span className="text-[11px] text-primary-foreground/50">2 pending</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-primary-foreground leading-snug">
              Smarter shifts,<br />happier teams.
            </h2>
            <p className="text-primary-foreground/55 text-[15px] leading-relaxed max-w-xs">
              Constraint-aware scheduling that balances fairness, preferences, and compliance — automatically.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["bg-primary-foreground/30", "bg-primary-foreground/20", "bg-primary-foreground/15"].map((bg, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-primary flex items-center justify-center`}>
                <span className="text-[9px] font-bold text-primary-foreground/60">{["JD", "ML", "AK"][i]}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-primary-foreground/50">
            <span className="text-primary-foreground font-semibold">500+ teams</span> trust Khedra
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-16 bg-background">
        <div className="w-full max-w-[360px] space-y-7">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <RiCalendarScheduleLine className="size-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">khedra</span>
          </div>

          {sent ? (
            /* ── Check your inbox state ── */
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <RiMailSendLine className="size-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-[22px] font-bold tracking-tight text-foreground">Check your inbox</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a sign-in link to{" "}
                  <span className="font-medium text-foreground">{sentEmail}</span>.
                  Click it to sign in — no password needed.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Didn't receive it? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => { setSent(false); form.reset() }}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  try a different email
                </button>
                .
              </div>
            </div>
          ) : (
            /* ── Sign-in form state ── */
            <>
              <div className="space-y-1">
                <h1 className="text-[22px] font-bold tracking-tight text-foreground">Welcome to Khedra</h1>
                <p className="text-sm text-muted-foreground">Sign in or create an account</p>
              </div>

              {/* Google */}
              <Button type="button" variant="outline" size="lg" className="w-full gap-2 font-medium" onClick={handleGoogleSignIn}>
                <RiGoogleFill className="size-4" />
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground">or with email</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  {serverError && (
                    <div className="flex items-start gap-2.5 rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3">
                      <div className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
                      <p className="text-sm text-destructive leading-snug">{serverError}</p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                            <Input
                              type="email"
                              placeholder="you@company.com"
                              className="pl-9"
                              autoComplete="email"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full gap-2 font-semibold" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Sending link…
                      </>
                    ) : (
                      <>
                        Send magic link
                        <RiArrowRightLine className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
